import hmac
import hashlib
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.payment import PaymentGatewaySetting, PaymentTransaction
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.schemas.payment import RazorpayVerifyAndOrderRequest, RazorpayOrderCreateRequest
from app.services.order_service import (
    generate_order_code,
    generate_invoice_number,
    calculate_server_authoritative_amounts
)
from app.services.audit_service import record_audit


def get_or_create_payment_settings(db: Session) -> PaymentGatewaySetting:
    """Retrieve existing payment settings or seed default from config."""
    db_setting = db.query(PaymentGatewaySetting).filter(PaymentGatewaySetting.gateway_name == "Razorpay").first()
    if not db_setting:
        db_setting = PaymentGatewaySetting(
            gateway_name="Razorpay",
            key_id=settings.RAZORPAY_KEY_ID,
            key_secret=settings.RAZORPAY_KEY_SECRET,
            is_active=settings.RAZORPAY_ENABLED,
            mode=settings.RAZORPAY_MODE,
            currency="INR",
            cod_enabled=True,
            auto_capture=True
        )
        db.add(db_setting)
        db.commit()
        db.refresh(db_setting)
    return db_setting


def create_razorpay_order_api(
    db: Session,
    current_user: User,
    order_create_req: Optional[RazorpayOrderCreateRequest] = None,
    amount_override: Optional[float] = None,
    notes: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Authoritative Razorpay order creation.
    Calculates exact server-side amount from cart items if provided, or validates amount.
    Persists a PaymentTransaction record to prevent client-side amount tampering.
    """
    payment_config = get_or_create_payment_settings(db)
    
    if not payment_config.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Razorpay Online Payment is currently disabled by administrator."
        )

    # 1. Authoritative Server-Side Amount Calculation (STRICTLY calculated from DB products)
    if order_create_req and order_create_req.items:
        subtotal, tax_amount, shipping, total_amount, _ = calculate_server_authoritative_amounts(
            db=db,
            items=order_create_req.items,
            current_user=current_user
        )
        authoritative_amount = total_amount
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart items are required for server-authoritative Razorpay payment order creation. Client-submitted payment amounts are strictly rejected."
        )

    if authoritative_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order amount."
        )

    amount_paise = int(round(authoritative_amount * 100))
    payment_attempt_id = f"atmpt_{uuid.uuid4().hex[:16]}"
    receipt_id = f"rcpt_{int(datetime.utcnow().timestamp())}"
    
    payload_notes = notes or {}
    payload_notes.update({
        "user_id": str(current_user.id),
        "email": current_user.email,
        "payment_attempt_id": payment_attempt_id
    })

    payload = {
        "amount": amount_paise,
        "currency": payment_config.currency or "INR",
        "receipt": receipt_id,
        "notes": payload_notes
    }

    razorpay_order_id = None

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(
                "https://api.razorpay.com/v1/orders",
                auth=(payment_config.key_id, payment_config.key_secret),
                json=payload
            )

        if resp.status_code in [200, 201]:
            data = resp.json()
            razorpay_order_id = data["id"]
        else:
            # Fallback ONLY in test/development mode
            if payment_config.mode == "test":
                razorpay_order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
            else:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Payment gateway returned an error. Please try again later."
                )
    except HTTPException:
        raise
    except Exception:
        # Fallback ONLY in test/development mode
        if payment_config.mode == "test":
            razorpay_order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
        else:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Payment gateway is unavailable. Please try again later."
            )

    # Persist authoritative PaymentTransaction
    transaction = PaymentTransaction(
        payment_attempt_id=payment_attempt_id,
        user_id=current_user.id,
        razorpay_order_id=razorpay_order_id,
        expected_amount=authoritative_amount,
        currency=payment_config.currency or "INR",
        status="CREATED"
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return {
        "razorpay_order_id": razorpay_order_id,
        "payment_attempt_id": payment_attempt_id,
        "amount": amount_paise,
        "currency": payment_config.currency or "INR",
        "key_id": payment_config.key_id
    }


def verify_razorpay_signature(
    key_secret: str,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
) -> bool:
    """Verify cryptographic HMAC-SHA256 signature from Razorpay checkout."""
    if not razorpay_signature or not razorpay_order_id or not razorpay_payment_id:
        return False
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    generated_signature = hmac.new(
        key_secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(generated_signature, razorpay_signature)


def create_verified_paid_order(
    db: Session,
    verify_req: RazorpayVerifyAndOrderRequest,
    current_user: User
) -> Order:
    """Validate Razorpay signature, amount integrity, replay prevention, and persist confirmed, paid order."""
    payment_config = get_or_create_payment_settings(db)

    # 1. Cryptographic signature check
    is_valid = verify_razorpay_signature(
        key_secret=payment_config.key_secret,
        razorpay_order_id=verify_req.razorpay_order_id,
        razorpay_payment_id=verify_req.razorpay_payment_id,
        razorpay_signature=verify_req.razorpay_signature
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed: Invalid Razorpay cryptographic signature."
        )

    # 2. Replay Prevention: Check if payment ID has already been verified
    existing_paid_order = db.query(Order).filter(Order.razorpay_payment_id == verify_req.razorpay_payment_id).first()
    if existing_paid_order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate payment verification: This Razorpay payment has already been processed."
        )

    # 3. Transaction & Amount Integrity Check
    transaction = db.query(PaymentTransaction).filter(
        PaymentTransaction.razorpay_order_id == verify_req.razorpay_order_id
    ).with_for_update().first()

    order_in = verify_req.order_data
    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item."
        )

    # Calculate authoritative order amount from DB
    subtotal, tax_amount, shipping_charge, total_amount, item_details = calculate_server_authoritative_amounts(
        db=db,
        items=order_in.items,
        current_user=current_user
    )

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment transaction not found. Payment must be initiated through the application."
        )

    if transaction.status == "VERIFIED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate transaction: This payment order has already been verified."
        )
    if transaction.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Transaction ownership mismatch."
        )
    if abs(transaction.expected_amount - total_amount) > 0.05:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment amount mismatch. Expected: ₹{transaction.expected_amount}, Computed: ₹{total_amount}"
        )

    is_distributor = current_user.role == UserRole.DISTRIBUTOR
    role_label = "Distributor" if is_distributor else "Retail Customer"
    order_code = generate_order_code()
    invoice_no = generate_invoice_number()

    order_items_to_create = []

    for item_data in item_details:
        product = db.query(Product).filter(Product.id == item_data["product_id"]).with_for_update().first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item_data['product_id']} not found."
            )
        if product.stock < item_data["quantity"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for '{product.name}'. Available: {product.stock}, Requested: {item_data['quantity']}"
            )

        # Deduct stock and increment reserved stock
        product.stock -= item_data["quantity"]
        product.reserved_stock += item_data["quantity"]

        order_item = OrderItem(
            product_id=product.id,
            product_name=product.name,
            sku=product.sku,
            batch_no=product.batch_no,
            unit_price=item_data["unit_price"],
            quantity=item_data["quantity"],
            total_price=item_data["total_price"]
        )
        order_items_to_create.append(order_item)

    new_order = Order(
        order_code=order_code,
        user_id=current_user.id,
        role=role_label,
        subtotal=subtotal,
        discount_amount=0.0,
        tax_amount=tax_amount,
        shipping_charge=shipping_charge,
        total_amount=total_amount,
        order_status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PAID,
        payment_method="Razorpay Online (UPI/Card)",
        customer_name=order_in.customer_name,
        customer_phone=order_in.customer_phone,
        gstin=order_in.gstin,
        delivery_address=order_in.delivery_address,
        delivery_city=order_in.delivery_city,
        delivery_state=order_in.delivery_state,
        delivery_pincode=order_in.delivery_pincode,
        invoice_number=invoice_no,
        razorpay_order_id=verify_req.razorpay_order_id,
        razorpay_payment_id=verify_req.razorpay_payment_id,
        razorpay_signature=verify_req.razorpay_signature,
        items=order_items_to_create
    )

    db.add(new_order)
    db.flush()

    transaction.status = "VERIFIED"
    transaction.razorpay_payment_id = verify_req.razorpay_payment_id
    transaction.application_order_id = new_order.id
    transaction.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(new_order)

    record_audit(
        db=db,
        action="ORDER_PAID_RAZORPAY",
        module="PAYMENTS",
        details=f"Payment verified via Razorpay ({verify_req.razorpay_payment_id}) for order {order_code} (₹{total_amount})",
        user=current_user
    )

    return new_order


def initiate_razorpay_refund(
    db: Session,
    order: Order,
    amount_inr: Optional[float] = None,
    reason: Optional[str] = None
) -> Tuple[bool, str, Optional[str]]:
    """
    Execute real Razorpay refund via Gateway API.
    Guarantees idempotency to prevent duplicate refund attempts.
    Never generates a fake refund ID — if the gateway fails, the order
    is marked REFUND_FAILED so it can be retried or reconciled.
    """
    # Idempotency: already refunded
    if order.refund_id and order.refund_status == "REFUNDED":
        return True, f"Refund already completed (Ref ID: {order.refund_id})", order.refund_id

    # Idempotency: refund pending at gateway
    if order.refund_status == "REFUND_PENDING":
        return True, f"Refund is already pending at gateway for order {order.order_code}", order.refund_id

    if order.payment_status != PaymentStatus.PAID:
        return False, f"Cannot refund order with payment status '{order.payment_status.value}'", None

    if not order.razorpay_payment_id:
        # No gateway payment to refund (e.g. COD that was manually marked paid)
        order.refund_status = "REFUND_FAILED"
        db.commit()
        return False, f"No Razorpay payment ID found for order {order.order_code}. Manual refund required.", None

    payment_config = get_or_create_payment_settings(db)
    refund_amount = amount_inr if amount_inr is not None else order.total_amount
    amount_paise = int(round(refund_amount * 100))

    gateway_refund_id = None
    refund_succeeded = False

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(
                f"https://api.razorpay.com/v1/payments/{order.razorpay_payment_id}/refund",
                auth=(payment_config.key_id, payment_config.key_secret),
                json={
                    "amount": amount_paise,
                    "notes": {"reason": reason or f"Refund for {order.order_code}"}
                }
            )
        if resp.status_code in [200, 201]:
            data = resp.json()
            gateway_refund_id = data.get("id")
            refund_succeeded = True
        else:
            # Gateway rejected the refund — do NOT fake a refund ID
            refund_succeeded = False
    except Exception:
        # Gateway unavailable (timeout, network error) — do NOT fake a refund ID
        refund_succeeded = False

    if refund_succeeded and gateway_refund_id:
        order.refund_id = gateway_refund_id
        order.refund_status = "REFUNDED"
        order.payment_status = PaymentStatus.REFUNDED
    else:
        # Mark as failed so admin can retry or reconcile
        order.refund_status = "REFUND_FAILED"
        # Do NOT change payment_status — order is still PAID until refund succeeds

    # Update payment transaction record
    if order.razorpay_order_id:
        tx = db.query(PaymentTransaction).filter(
            PaymentTransaction.razorpay_order_id == order.razorpay_order_id
        ).first()
        if tx:
            tx.status = "REFUNDED" if refund_succeeded else "REFUND_FAILED"
            if gateway_refund_id:
                tx.refund_id = gateway_refund_id
            tx.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(order)

    if refund_succeeded:
        record_audit(
            db=db,
            action="PAYMENT_REFUNDED",
            module="PAYMENTS",
            details=f"Refund of ₹{refund_amount:.2f} processed for order {order.order_code} (Gateway Refund ID: {gateway_refund_id})",
            user=order.user
        )
        return True, f"Refund successfully initiated. Ref ID: {gateway_refund_id}", gateway_refund_id
    else:
        record_audit(
            db=db,
            action="PAYMENT_REFUND_FAILED",
            module="PAYMENTS",
            details=f"Refund of ₹{refund_amount:.2f} FAILED for order {order.order_code}. Gateway did not confirm refund.",
            user=order.user
        )
        return False, f"Refund failed for order {order.order_code}. Gateway did not confirm. Manual intervention required.", None

