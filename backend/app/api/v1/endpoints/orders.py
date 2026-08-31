from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_admin
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.product import Product
from app.schemas.order import (
    OrderCreateRequest,
    OrderStatusUpdateRequest,
    OrderOut,
    InvoiceOut,
    OrderItemOut
)
from app.services.order_service import create_order
from app.services.payment_service import initiate_razorpay_refund
from app.services.audit_service import record_audit
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Order State Machine ───────────────────────────────────────────
# Centralized valid transitions to prevent arbitrary status changes.
VALID_ORDER_TRANSITIONS = {
    OrderStatus.PENDING:   [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    OrderStatus.CONFIRMED: [OrderStatus.PACKED, OrderStatus.CANCELLED],
    OrderStatus.PACKED:    [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    OrderStatus.SHIPPED:   [OrderStatus.DELIVERED],
    OrderStatus.DELIVERED: [OrderStatus.RETURNED],
    OrderStatus.CANCELLED: [],
    OrderStatus.RETURNED:  [],
}


def validate_order_transition(old_status: OrderStatus, new_status: OrderStatus) -> None:
    """Enforce strict order state machine transitions."""
    allowed = VALID_ORDER_TRANSITIONS.get(old_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid order status transition: '{old_status.value}' → '{new_status.value}'. "
                   f"Allowed transitions: {[s.value for s in allowed]}"
        )


def release_reserved_stock(db: Session, order: Order) -> None:
    """Release reserved_stock back to available stock on cancellation."""
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if product:
            if product.reserved_stock < item.quantity:
                logger.warning(
                    f"Inventory inconsistency: product {product.id} ({product.name}) "
                    f"reserved_stock={product.reserved_stock} < release quantity={item.quantity} "
                    f"for order {order.order_code}. Clamping to zero and logging."
                )
                record_audit(
                    db=db,
                    action="INVENTORY_INCONSISTENCY",
                    module="INVENTORY",
                    details=f"Reserved stock underflow detected for product {product.id} ({product.name}). "
                            f"reserved_stock={product.reserved_stock}, attempted release={item.quantity}, "
                            f"order={order.order_code}"
                )
                product.stock += item.quantity
                product.reserved_stock = 0
            else:
                product.stock += item.quantity
                product.reserved_stock -= item.quantity


def finalize_reserved_stock(db: Session, order: Order) -> None:
    """On shipment, reserved_stock is consumed (deducted). Stock was already deducted at order time."""
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if product:
            if product.reserved_stock < item.quantity:
                logger.warning(
                    f"Inventory inconsistency: product {product.id} ({product.name}) "
                    f"reserved_stock={product.reserved_stock} < finalize quantity={item.quantity} "
                    f"for order {order.order_code}. Clamping to zero and logging."
                )
                record_audit(
                    db=db,
                    action="INVENTORY_INCONSISTENCY",
                    module="INVENTORY",
                    details=f"Reserved stock underflow on finalize for product {product.id} ({product.name}). "
                            f"reserved_stock={product.reserved_stock}, attempted finalize={item.quantity}, "
                            f"order={order.order_code}"
                )
                product.reserved_stock = 0
            else:
                product.reserved_stock -= item.quantity


# ─── Endpoints ─────────────────────────────────────────────────────

@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def place_order(
    order_in: OrderCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_order(db=db, order_in=order_in, current_user=current_user)


@router.get("/my-orders", response_model=List[OrderOut])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
    return orders


@router.get("/admin/all", response_model=List[OrderOut])
def list_all_orders_admin(
    order_status: Optional[OrderStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by order code, customer name or phone"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    query = db.query(Order)
    if order_status:
        query = query.filter(Order.order_status == order_status)
    if search:
        search_pat = f"%{search}%"
        query = query.filter(
            (Order.order_code.ilike(search_pat)) |
            (Order.customer_name.ilike(search_pat)) |
            (Order.customer_phone.ilike(search_pat))
        )
    return query.order_by(Order.created_at.desc()).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order_details(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Only allow owner or admin
    if current_user.role != UserRole.ADMIN and order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    old_status = order.order_status
    new_status = status_update.order_status

    # Enforce state machine
    validate_order_transition(old_status, new_status)

    order.order_status = new_status

    if status_update.admin_notes:
        order.admin_notes = status_update.admin_notes
    if status_update.tracking_number:
        order.tracking_number = status_update.tracking_number

    # On delivery: COD payment status update only. Stock was already finalized at SHIPPED.
    if new_status == OrderStatus.DELIVERED:
        # Mark COD as paid on delivery
        if order.payment_status == PaymentStatus.COD:
            order.payment_status = PaymentStatus.PAID

    # On shipped: finalize reserved stock (consumed — stock was deducted at order time)
    if new_status == OrderStatus.SHIPPED:
        finalize_reserved_stock(db, order)

    # On cancellation: release reserved stock and initiate real refund
    if new_status == OrderStatus.CANCELLED:
        release_reserved_stock(db, order)

        is_cod = (order.payment_method or "").upper() == "COD" or order.payment_status == PaymentStatus.COD
        if is_cod or not order.razorpay_payment_id:
            order.payment_status = PaymentStatus.REFUNDED
            order.refund_status = "REFUNDED"
            order.refund_id = f"COD_CANCEL_{order.id}"
            cancel_note = "[COD CANCELLED]: COD order cancelled. No online gateway refund required."
            order.admin_notes = f"{order.admin_notes}\n{cancel_note}" if order.admin_notes else cancel_note
        elif order.payment_status == PaymentStatus.PAID:
            success, msg, refund_ref = initiate_razorpay_refund(db, order)
            refund_note = f"[REFUND]: {msg}"
            order.admin_notes = f"{order.admin_notes}\n{refund_note}" if order.admin_notes else refund_note
        elif order.payment_status == PaymentStatus.PENDING:
            order.payment_status = PaymentStatus.REFUNDED
            order.refund_status = "REFUNDED"
            order.refund_id = f"CANCEL_VOID_{order.id}"
            cancel_note = "[CANCELLED]: Cancelled before payment completion. No refund required."
            order.admin_notes = f"{order.admin_notes}\n{cancel_note}" if order.admin_notes else cancel_note

    db.commit()
    db.refresh(order)

    record_audit(
        db=db,
        action="ORDER_STATUS_UPDATED",
        module="ORDERS",
        details=f"Order {order.order_code} status changed from {old_status} to {new_status} by Admin",
        user=admin_user
    )

    try:
        from app.services.notification_service import notify_order_status_update
        from app.models.user import User
        target_user = db.query(User).filter(User.id == order.user_id).first()
        if target_user:
            notify_order_status_update(db=db, order=order, user=target_user, new_status=new_status.value)
    except Exception as e:
        pass

    return order


@router.post("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel order by customer or admin with real refund and restocking."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role != UserRole.ADMIN and order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Enforce state machine
    validate_order_transition(order.order_status, OrderStatus.CANCELLED)

    old_status = order.order_status
    order.order_status = OrderStatus.CANCELLED

    # Restock inventory
    release_reserved_stock(db, order)

    # Real refund processing
    if order.payment_status == PaymentStatus.PAID:
        success, msg, refund_ref = initiate_razorpay_refund(db, order)
        refund_note = f"[AUTOMATED REFUND]: {msg}"
        order.admin_notes = f"{order.admin_notes}\n{refund_note}" if order.admin_notes else refund_note
    elif order.payment_status == PaymentStatus.PENDING:
        order.admin_notes = f"{order.admin_notes}\n[CANCELLED]: Order cancelled prior to payment. No refund required." if order.admin_notes else "[CANCELLED]: Order cancelled prior to payment. No refund required."

    db.commit()
    db.refresh(order)

    record_audit(
        db=db,
        action="ORDER_CANCELLED",
        module="ORDERS",
        details=f"Order {order.order_code} cancelled by {current_user.email}. Refund status: {order.payment_status.value}",
        user=current_user
    )

    return order


@router.get("/{order_id}/invoice", response_model=InvoiceOut)
def get_order_invoice(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role != UserRole.ADMIN and order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    invoice_no = order.invoice_number or f"INV-EVV-{order.order_code}"

    items_out = [OrderItemOut.model_validate(item) for item in order.items]

    return InvoiceOut(
        invoice_number=invoice_no,
        order_code=order.order_code,
        invoice_date=order.created_at,
        company_name="EVVAI Pharmaceuticals Private Limited",
        company_gstin="36AAACE1234F1Z5",
        company_address="Survey 45/B, Genome Valley, Hyderabad, Telangana - 500078",
        buyer_name=order.customer_name,
        buyer_role=order.role,
        buyer_gstin=order.gstin,
        buyer_address=f"{order.delivery_address}, {order.delivery_city}, {order.delivery_state} - {order.delivery_pincode}",
        subtotal=order.subtotal,
        tax_amount=order.tax_amount,
        total_amount=order.total_amount,
        payment_status=order.payment_status.value,
        items=items_out
    )


@router.post("/{order_id}/return", response_model=OrderOut)
def request_order_return(
    order_id: int,
    reason: Optional[str] = Query(None, description="Reason for return/refund request"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Request Return & Refund for delivered orders with support for Razorpay and COD/Offline."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role != UserRole.ADMIN and order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Enforce state machine
    validate_order_transition(order.order_status, OrderStatus.RETURNED)

    order.order_status = OrderStatus.RETURNED

    is_cod = (order.payment_method or "").upper() == "COD" or order.payment_status == PaymentStatus.COD
    reason_str = f" Reason: {reason}" if reason else ""

    if is_cod or not order.razorpay_payment_id:
        order.payment_status = PaymentStatus.REFUNDED
        order.refund_status = "REFUNDED"
        order.refund_id = f"COD_RETURN_{order.id}"
        return_note = f"[COD RETURN PROCESSED]: Customer requested return.{reason_str} COD refund marked as completed."
        order.admin_notes = f"{order.admin_notes}\n{return_note}" if order.admin_notes else return_note
    elif order.payment_status == PaymentStatus.PAID:
        success, msg, refund_ref = initiate_razorpay_refund(db, order, reason=reason)
        return_note = f"[RETURN & REFUND]: {msg}{reason_str}"
        order.admin_notes = f"{order.admin_notes}\n{return_note}" if order.admin_notes else return_note
    else:
        order.payment_status = PaymentStatus.REFUNDED
        order.refund_status = "REFUNDED"
        order.refund_id = f"RETURN_VOID_{order.id}"
        return_note = f"[RETURN PROCESSED]: Order returned.{reason_str} No online payment to refund."
        order.admin_notes = f"{order.admin_notes}\n{return_note}" if order.admin_notes else return_note

    db.commit()
    db.refresh(order)

    record_audit(
        db=db,
        action="ORDER_RETURN_REQUESTED",
        module="ORDERS",
        details=f"Return & Refund requested for order {order.order_code} by {current_user.email}.",
        user=current_user
    )

    return order


class AdminRefundRequest(BaseModel):
    amount: Optional[float] = None
    reason: Optional[str] = "Manual refund initiated via Admin Order Management"


@router.post("/{order_id}/admin-refund", response_model=OrderOut)
def admin_issue_refund(
    order_id: int,
    req: AdminRefundRequest = AdminRefundRequest(),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Directly issue refund (Razorpay Gateway or Manual COD/Offline) for an order by Administrator."""
    order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.refund_id and order.refund_status == "REFUNDED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order {order.order_code} has already been refunded (Refund ID: {order.refund_id})."
        )

    is_cod = (order.payment_method or "").upper() == "COD" or order.payment_status == PaymentStatus.COD
    refund_amount = req.amount if req.amount is not None else order.total_amount

    # Case A: Cash On Delivery (COD) or Offline Order (No Razorpay payment ID)
    if is_cod or not order.razorpay_payment_id:
        if order.payment_status == PaymentStatus.PAID:
            order.refund_id = f"COD_MANUAL_REFUND_{order.id}"
            refund_note = f"[COD MANUAL REFUND]: Admin processed cash refund of ₹{refund_amount:,.2f}. Reason: {req.reason}"
        else:
            order.refund_id = f"COD_VOID_{order.id}"
            refund_note = f"[COD CANCELLED / VOIDED]: Admin voided COD payment of ₹{refund_amount:,.2f}. Reason: {req.reason}"

        order.payment_status = PaymentStatus.REFUNDED
        order.refund_status = "REFUNDED"

        # Update order status to CANCELLED or RETURNED
        if order.order_status == OrderStatus.DELIVERED:
            order.order_status = OrderStatus.RETURNED
        elif order.order_status not in [OrderStatus.CANCELLED, OrderStatus.RETURNED]:
            order.order_status = OrderStatus.CANCELLED
            release_reserved_stock(db, order)

        order.admin_notes = f"{order.admin_notes}\n{refund_note}" if order.admin_notes else refund_note
        db.commit()
        db.refresh(order)

        record_audit(
            db=db,
            action="ORDER_COD_REFUNDED",
            module="ORDERS",
            details=f"Admin {admin_user.email} issued COD refund/void for order {order.order_code}.",
            user=admin_user
        )
        return order

    # Case B: Online Razorpay order but not marked PAID
    if order.payment_status != PaymentStatus.PAID:
        order.payment_status = PaymentStatus.REFUNDED
        order.refund_status = "REFUNDED"
        order.refund_id = f"MANUAL_VOID_{order.id}"
        refund_note = f"[OFFLINE VOID]: Order payment was '{order.payment_status.value}'. Marked as refunded by Admin. Reason: {req.reason}"
        order.admin_notes = f"{order.admin_notes}\n{refund_note}" if order.admin_notes else refund_note
        if order.order_status not in [OrderStatus.CANCELLED, OrderStatus.RETURNED]:
            order.order_status = OrderStatus.CANCELLED
            release_reserved_stock(db, order)
        db.commit()
        db.refresh(order)
        return order

    # Case C: Online Razorpay order with valid payment
    success, msg, refund_ref = initiate_razorpay_refund(db, order, amount_inr=req.amount, reason=req.reason)
    
    refund_note = f"[ADMIN REFUND]: {msg}"
    order.admin_notes = f"{order.admin_notes}\n{refund_note}" if order.admin_notes else refund_note

    db.commit()
    db.refresh(order)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )

    return order
