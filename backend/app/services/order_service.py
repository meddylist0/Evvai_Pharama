from app.services.inventory_service import deduct_fefo_stock
from app.models.order import OrderItemBatchAllocation
import random
import logging
from datetime import datetime
from typing import List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.schemas.order import OrderCreateRequest, OrderItemCreate
from app.core.permissions import check_distributor_kyc_approved, check_retailer_kyc_approved
from app.services.audit_service import record_audit

logger = logging.getLogger("pharmalink.orders")


def generate_order_code() -> str:
    timestamp = datetime.utcnow().strftime("%y%m%d")
    unique_suffix = f"{int(datetime.utcnow().timestamp() * 1000) % 100000:05d}-{random.randint(100, 999)}"
    return f"ORD-{timestamp}-{unique_suffix}"


def generate_invoice_number() -> str:
    timestamp = datetime.utcnow().strftime("%Y%m")
    unique_suffix = f"{int(datetime.utcnow().timestamp() * 1000) % 100000:05d}-{random.randint(100, 999)}"
    return f"INV-EVV-{timestamp}-{unique_suffix}"


def calculate_server_authoritative_amounts(
    db: Session,
    items: List[OrderItemCreate],
    current_user: User
) -> Tuple[float, float, float, float, List[dict]]:
    """
    Authoritative server-side price & GST tax calculation from DB products.
    Returns (subtotal, tax_amount, shipping_charge, total_amount, item_details).
    """
    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart must contain at least one item."
        )

    is_distributor = current_user.role == UserRole.DISTRIBUTOR
    is_retailer = current_user.role == UserRole.RETAILER

    if is_distributor and not check_distributor_kyc_approved(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Distributor KYC approval required for wholesale operations."
        )

    if is_retailer and not check_retailer_kyc_approved(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Retailer Drug License & KYC approval required to place B2B trade orders."
        )

    subtotal = 0.0
    tax_amount = 0.0
    item_details = []

    for item_req in items:
        # Normalize quantity: Cartons (50 packs/carton) + loose packs
        carton_qty = getattr(item_req, 'carton_quantity', 0) or 0
        pack_qty = getattr(item_req, 'pack_quantity', None)
        
        if carton_qty > 0:
            ordered_packs = (carton_qty * 50) + (pack_qty if pack_qty is not None else 0)
        else:
            ordered_packs = pack_qty if pack_qty is not None else item_req.quantity

        if ordered_packs <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Quantity for product ID {item_req.product_id} must be greater than zero."
            )

        product = db.query(Product).filter(Product.id == item_req.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item_req.product_id} not found."
            )
        if product.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name}' is currently unavailable for order."
            )

        # Price lookup
        if is_distributor:
            if ordered_packs >= product.bulk_moq and product.bulk_price > 0:
                unit_price = product.bulk_price
            else:
                unit_price = product.distributor_price
        elif is_retailer:
            # PTR (Price to Retailer)
            ptr_rate = round(product.distributor_price * 1.12, 2) if product.distributor_price else product.customer_price
            unit_price = min(ptr_rate, product.customer_price)
        else:
            unit_price = product.customer_price

        # Scheme Calculation (e.g. 10+1 Free Goods)
        scheme_free = getattr(item_req, 'scheme_free_quantity', 0) or 0
        scheme_name = getattr(item_req, 'scheme_name', None)
        if is_retailer and not scheme_free and scheme_name and "10" in scheme_name:
            scheme_free = (ordered_packs // 10) * 1

        total_dispatch_packs = ordered_packs + scheme_free
        billed_packs = ordered_packs

        item_total = round(unit_price * billed_packs, 2)
        subtotal += item_total

        # Item GST rate from DB product
        item_gst_rate = getattr(product, 'gst_rate', None)
        if item_gst_rate is None or item_gst_rate < 0:
            item_gst_rate = 0.12
        item_tax = round(item_total * item_gst_rate, 2)
        tax_amount += item_tax

        item_details.append({
            "product": product,
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "batch_no": product.batch_no,
            "unit_price": unit_price,
            "quantity": billed_packs,
            "total_dispatch_quantity": total_dispatch_packs,
            "scheme_free_quantity": scheme_free,
            "scheme_name": scheme_name,
            "total_price": item_total,
            "gst_rate": item_gst_rate,
            "tax": item_tax
        })

    subtotal = round(subtotal, 2)
    tax_amount = round(tax_amount, 2)
    shipping_charge = 0.0 if subtotal > 1000 or is_distributor or is_retailer else 50.0
    discount_amount = 0.0
    total_amount = round(subtotal + tax_amount + shipping_charge - discount_amount, 2)

    return subtotal, tax_amount, shipping_charge, total_amount, item_details


def create_order(db: Session, order_in: OrderCreateRequest, current_user: User) -> Order:
    from app.core.permissions import check_retailer_kyc_approved
    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item."
        )

    is_distributor = current_user.role == UserRole.DISTRIBUTOR
    is_retailer = current_user.role == UserRole.RETAILER

    if is_distributor and not check_distributor_kyc_approved(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Distributor KYC approval required to place wholesale orders."
        )

    if is_retailer and not check_retailer_kyc_approved(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Retailer Drug License & KYC approval required to place B2B trade orders."
        )

    role_label = "Distributor" if is_distributor else ("Pharmacy Retailer" if is_retailer else "Retail Customer")
    order_code = generate_order_code()
    invoice_no = generate_invoice_number()

    subtotal, tax_amount, shipping_charge, total_amount, item_details = calculate_server_authoritative_amounts(
        db=db,
        items=order_in.items,
        current_user=current_user
    )

    # Approved Trade Credit Validation
    payment_mode = (order_in.payment_method or "").lower()
    if is_retailer and ("credit" in payment_mode or "net-30" in payment_mode):
        credit_limit = current_user.retailer_profile.credit_limit if current_user.retailer_profile else 100000.0
        # Compute outstanding unpaid orders
        unpaid_orders = (
            db.query(Order)
            .filter(
                Order.user_id == current_user.id,
                Order.payment_status == PaymentStatus.PENDING,
                Order.order_status != OrderStatus.CANCELLED
            )
            .all()
        )
        outstanding = sum(o.total_amount for o in unpaid_orders)
        available_credit = max(0.0, credit_limit - outstanding)

        if outstanding + total_amount > credit_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order amount ₹{total_amount:,.2f} exceeds approved trade credit limit. Limit: ₹{credit_limit:,.2f}, Outstanding: ₹{outstanding:,.2f}, Available: ₹{available_credit:,.2f}."
            )

    try:
        order_items_to_create = []

        for item_data in item_details:
            product = db.query(Product).filter(Product.id == item_data["product_id"]).with_for_update().first()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item_data['product_id']} not found."
                )

            dispatch_qty = item_data.get("total_dispatch_quantity", item_data["quantity"])

            # Deduct stock across batches using FEFO for the full physical dispatch quantity
            allocations = deduct_fefo_stock(
                db=db,
                product=product,
                required_qty=dispatch_qty,
                transaction_type="SALE",
                reason=f"Order {order_code} Fulfillment (Billed: {item_data['quantity']}, Free: {item_data.get('scheme_free_quantity', 0)})",
                user=current_user
            )

            primary_batch_no = allocations[0][0].batch_no if allocations else (product.batch_no or "N/A")

            order_item = OrderItem(
                product_id=product.id,
                product_name=product.name,
                sku=product.sku,
                batch_no=primary_batch_no,
                unit_price=item_data["unit_price"],
                quantity=item_data["quantity"],
                total_price=item_data["total_price"]
            )

            product.reserved_stock = (product.reserved_stock or 0) + dispatch_qty

            # Persist individual multi-batch allocations
            for batch, qty in allocations:
                batch_alloc = OrderItemBatchAllocation(
                    batch_id=batch.id,
                    batch_no=batch.batch_no,
                    quantity=qty
                )
                order_item.batch_allocations.append(batch_alloc)

            order_items_to_create.append(order_item)

        # Payment & Order Status determination
        is_cod = "cod" in payment_mode or "pod" in payment_mode
        is_trade_credit = "credit" in payment_mode or "net-30" in payment_mode
        initial_payment_status = PaymentStatus.COD if is_cod else PaymentStatus.PENDING
        initial_order_status = OrderStatus.CONFIRMED if (is_cod or is_distributor or is_trade_credit) else OrderStatus.PENDING

        new_order = Order(
            order_code=order_code,
            user_id=current_user.id,
            role=role_label,
            subtotal=subtotal,
            discount_amount=0.0,
            tax_amount=tax_amount,
            shipping_charge=shipping_charge,
            total_amount=total_amount,
            order_status=initial_order_status,
            payment_status=initial_payment_status,
            payment_method=order_in.payment_method,
            customer_name=order_in.customer_name,
            customer_phone=order_in.customer_phone,
            gstin=order_in.gstin,
            delivery_address=order_in.delivery_address,
            delivery_city=order_in.delivery_city,
            delivery_state=order_in.delivery_state,
            delivery_pincode=order_in.delivery_pincode,
            invoice_number=invoice_no,
            items=order_items_to_create
        )

        db.add(new_order)

        record_audit(
            db=db,
            action="ORDER_PLACED",
            module="ORDERS",
            details=f"Order {order_code} placed by {current_user.email} (Role: {role_label}) for ₹{total_amount}",
            user=current_user
        )

        db.commit()
        db.refresh(new_order)
    except Exception:
        db.rollback()
        raise

    try:
        from app.services.notification_service import notify_order_created
        notify_order_created(db=db, order=new_order, user=current_user)
    except Exception as e:
        logger.exception("Failed to dispatch order creation notification: %s", e)

    return new_order

