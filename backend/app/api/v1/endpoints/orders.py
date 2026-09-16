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


# ==============================================================================
# PHARMALINK ENTERPRISE — ORDER MANAGEMENT & INVENTORY RESTOCK ENDPOINTS
#
# Developer Notes for Team:
# 1. Order cancellations & returns MUST restore stock to the EXACT original
#    ProductBatch records via OrderItemBatchAllocation. Never invent fake fallback batches!
# 2. Call db.flush() before sync_product_master_stock() so SQL queries see
#    restored batches that transitioned from 'depleted' -> 'active'.
# 3. State machine validation (validate_order_transition) enforces legal status steps
#    and prevents duplicate cancellation/return requests (Idempotency).
# ==============================================================================

def restock_order_inventory(db: Session, order: Order, reason_prefix: str = "Restock") -> None:
    """
    Restores inventory to the exact original ProductBatch records from OrderItemBatchAllocation.
    Logs an InventoryTransaction for each batch restoration and syncs Product.stock.
    Raises HTTPException(400) if historical batch allocation cannot be found.
    """
    from app.services.inventory_service import sync_product_master_stock
    from app.models.product import ProductBatch, InventoryTransaction

    for item in order.items:
        if not item.product_id:
            continue
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if not product:
            continue

        running_stock = product.stock

        if item.batch_allocations:
            for alloc in item.batch_allocations:
                batch = None
                if alloc.batch_id:
                    batch = db.query(ProductBatch).filter(ProductBatch.id == alloc.batch_id).with_for_update().first()
                if not batch and alloc.batch_no:
                    batch = db.query(ProductBatch).filter(
                        ProductBatch.product_id == product.id,
                        ProductBatch.batch_no == alloc.batch_no
                    ).with_for_update().first()

                if not batch:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot restock inventory for Order {order.order_code}: Original batch '{alloc.batch_no}' no longer exists."
                    )

                batch.quantity += alloc.quantity
                if batch.status in ["depleted", "expired"] and batch.quantity > 0:
                    now = datetime.utcnow()
                    if not batch.expiry_date_val or batch.expiry_date_val >= now:
                        batch.status = "active"

                running_stock += alloc.quantity

                txn = InventoryTransaction(
                    product_id=product.id,
                    batch_id=batch.id,
                    transaction_type="RESTOCK" if "Cancel" in reason_prefix else "RETURN",
                    quantity=alloc.quantity,
                    balance_after=running_stock,
                    reason=f"{reason_prefix} for Order {order.order_code} (Batch {batch.batch_no})"
                )
                db.add(txn)
        else:
            if not item.batch_no:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot restock inventory for Order {order.order_code}: Item '{item.product_name}' lacks batch allocation history."
                )

            batch = db.query(ProductBatch).filter(
                ProductBatch.product_id == product.id,
                ProductBatch.batch_no == item.batch_no
            ).with_for_update().first()

            if not batch:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot restock inventory for Order {order.order_code}: Original batch '{item.batch_no}' no longer exists."
                )

            batch.quantity += item.quantity
            if batch.status in ["depleted", "expired"] and batch.quantity > 0:
                now = datetime.utcnow()
                if not batch.expiry_date_val or batch.expiry_date_val >= now:
                    batch.status = "active"

            running_stock += item.quantity

            txn = InventoryTransaction(
                product_id=product.id,
                batch_id=batch.id,
                transaction_type="RESTOCK" if "Cancel" in reason_prefix else "RETURN",
                quantity=item.quantity,
                balance_after=running_stock,
                reason=f"{reason_prefix} for Order {order.order_code} (Batch {batch.batch_no})"
            )
            db.add(txn)

        if product.reserved_stock > 0:
            product.reserved_stock = max(0, product.reserved_stock - item.quantity)

        db.flush()
        sync_product_master_stock(db, product)


def finalize_reserved_stock(db: Session, order: Order) -> None:
    """On shipment, reserved_stock is consumed (deducted). Stock was already deducted at order time."""
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if product:
            if product.reserved_stock < item.quantity:
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
    """
    Placing Customer / Distributor Order.
    
    DEVELOPER NOTES:
    - Authoritative server-side subtotal & GST tax calculations from Product model.
    - Triggers FEFO stock deduction (deduct_fefo_stock) with DB row-locking (with_for_update).
    - Persists OrderItemBatchAllocation records for 100% item-to-batch traceability.
    - Increments Product.reserved_stock to track pending unshipped order items.
    """
    return create_order(db=db, order_in=order_in, current_user=current_user)


@router.get("/my-orders", response_model=List[OrderOut])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Customer Order History Listing.
    
    DEVELOPER NOTES:
    - Returns all orders placed by current authenticated user sorted by created_at DESC.
    """
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
    return orders


@router.get("/admin/all", response_model=List[OrderOut])
def list_all_orders_admin(
    order_status: Optional[OrderStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by order code, customer name or phone"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Admin Order Management Listing.
    
    DEVELOPER NOTES:
    - Restricted to ADMIN role (require_admin).
    - Supports status filtering and case-insensitive search (ilike) across order_code, customer_name, customer_phone.
    """
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
def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Order Details Lookup by ID.
    
    DEVELOPER NOTES:
    - Non-admin users are restricted to viewing their own orders (order.user_id == current_user.id).
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role != UserRole.ADMIN and order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return order


@router.put("/{order_id}/status", response_model=OrderOut)
@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Admin Order Status State Machine Transition Handler.
    
    DEVELOPER NOTES:
    - Supports both PUT and PATCH HTTP methods for status progression.
    - Enforces legal transitions via validate_order_transition().
    - SHIPPED status: Calls finalize_reserved_stock() to deduct reserved_stock counter.
    - CANCELLED status: Triggers restock_order_inventory() to restore exact batches and initiates refund if paid.
    """
    order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    old_status = order.order_status
    new_status = status_update.order_status

    validate_order_transition(old_status, new_status)

    order.order_status = new_status

    if status_update.admin_notes:
        order.admin_notes = status_update.admin_notes
    if status_update.tracking_number:
        order.tracking_number = status_update.tracking_number

    if new_status == OrderStatus.DELIVERED:
        if order.payment_status == PaymentStatus.COD:
            order.payment_status = PaymentStatus.PAID

    if new_status == OrderStatus.SHIPPED:
        finalize_reserved_stock(db, order)

    if new_status == OrderStatus.CANCELLED:
        restock_order_inventory(db, order, reason_prefix="Cancellation Restock")

        reason_text = f" Reason: {status_update.admin_notes}" if status_update.admin_notes else ""
        pm_upper = (order.payment_method or "").upper()
        is_credit = "CREDIT" in pm_upper or "NET-30" in pm_upper or "PAY LATER" in pm_upper or "B2B" in pm_upper
        is_cod = pm_upper == "COD" or order.payment_status == PaymentStatus.COD

        if is_credit:
            order.payment_status = PaymentStatus.CANCELLED
            order.refund_status = "RESTORED"
            order.refund_id = f"CREDIT_RESTORE_{order.id}"
            cancel_note = f"[CREDIT LIMIT RESTORED]: Order cancelled by Admin.{reason_text} B2B Trade Credit Limit of ₹{order.total_amount:,.2f} restored to partner's account."
            order.admin_notes = f"{order.admin_notes}\n{cancel_note}" if order.admin_notes else cancel_note
        elif is_cod:
            order.payment_status = PaymentStatus.CANCELLED
            order.refund_status = "CANCELLED"
            order.refund_id = f"COD_CANCEL_{order.id}"
            cancel_note = f"[COD CANCELLED]: COD order cancelled by Admin.{reason_text} Stock restored to inventory."
            order.admin_notes = f"{order.admin_notes}\n{cancel_note}" if order.admin_notes else cancel_note
        elif order.payment_status == PaymentStatus.PAID and order.razorpay_payment_id:
            success, msg, refund_ref = initiate_razorpay_refund(db, order, reason=status_update.admin_notes)
            order.payment_status = PaymentStatus.REFUNDED
            order.refund_status = "REFUNDED" if success else "REFUND_FAILED"
            order.refund_id = refund_ref or f"RFND_{order.order_code}"
            refund_note = f"[AUTOMATED REFUND]: Full refund of ₹{order.total_amount:,.2f} initiated.{reason_text}"
            order.admin_notes = f"{order.admin_notes}\n{refund_note}" if order.admin_notes else refund_note
        else:
            order.payment_status = PaymentStatus.CANCELLED
            order.refund_status = "CANCELLED"
            order.refund_id = f"CANCEL_VOID_{order.id}"
            cancel_note = f"[CANCELLED]: Order cancelled by Admin prior to payment completion.{reason_text}"
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
    except Exception:
        pass

    return order


@router.post("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(
    order_id: int,
    reason: Optional[str] = Query(None, description="Reason for order cancellation"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel order by customer or admin with real refund, reason recording, and batch restocking."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role != UserRole.ADMIN and order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    validate_order_transition(order.order_status, OrderStatus.CANCELLED)

    old_status = order.order_status
    order.order_status = OrderStatus.CANCELLED

    # Restock inventory to original batches
    restock_order_inventory(db, order, reason_prefix="Cancellation Restock")

    reason_text = f" Reason: {reason}" if reason else ""

    pm_upper = (order.payment_method or "").upper()
    is_credit = "CREDIT" in pm_upper or "NET-30" in pm_upper or "PAY LATER" in pm_upper or "B2B" in pm_upper
    is_cod = pm_upper == "COD" or order.payment_status == PaymentStatus.COD

    if is_credit:
        order.payment_status = PaymentStatus.CANCELLED
        order.refund_status = "RESTORED"
        order.refund_id = f"CREDIT_RESTORE_{order.id}"
        cancel_note = f"[CREDIT LIMIT RESTORED]: Order cancelled by {current_user.email}.{reason_text} B2B Trade Credit Limit of ₹{order.total_amount:,.2f} restored to partner's account."
        order.admin_notes = f"{order.admin_notes}\n{cancel_note}" if order.admin_notes else cancel_note
    elif is_cod:
        order.payment_status = PaymentStatus.CANCELLED
        order.refund_status = "CANCELLED"
        order.refund_id = f"COD_CANCEL_{order.id}"
        cancel_note = f"[COD CANCELLED]: COD order cancelled by {current_user.email}.{reason_text} Stock restored to inventory."
        order.admin_notes = f"{order.admin_notes}\n{cancel_note}" if order.admin_notes else cancel_note
    elif order.payment_status == PaymentStatus.PAID and order.razorpay_payment_id:
        success, msg, refund_ref = initiate_razorpay_refund(db, order, reason=reason)
        order.payment_status = PaymentStatus.REFUNDED
        order.refund_status = "REFUNDED" if success else "REFUND_FAILED"
        order.refund_id = refund_ref or f"RFND_{order.order_code}"
        refund_note = f"[AUTOMATED REFUND]: Full refund of ₹{order.total_amount:,.2f} initiated.{reason_text}"
        order.admin_notes = f"{order.admin_notes}\n{refund_note}" if order.admin_notes else refund_note
    else:
        order.payment_status = PaymentStatus.CANCELLED
        order.refund_status = "CANCELLED"
        order.refund_id = f"CANCEL_VOID_{order.id}"
        cancel_note = f"[CANCELLED]: Order cancelled prior to payment completion.{reason_text}"
        order.admin_notes = f"{order.admin_notes}\n{cancel_note}" if order.admin_notes else cancel_note

    db.commit()
    db.refresh(order)

    record_audit(
        db=db,
        action="ORDER_CANCELLED",
        module="ORDERS",
        details=f"Order {order.order_code} cancelled by {current_user.email}.{reason_text} Refund status: {order.refund_status}",
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
    """Request Return & Refund for delivered orders with batch restocking."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role != UserRole.ADMIN and order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    validate_order_transition(order.order_status, OrderStatus.RETURNED)

    order.order_status = OrderStatus.RETURNED

    # Restock inventory to original batches
    restock_order_inventory(db, order, reason_prefix="Return Restock")

    is_cod = (order.payment_method or "").upper() == "COD" or order.payment_status == PaymentStatus.COD
    reason_str = f" Reason: {reason}" if reason else ""

    if is_cod or not order.razorpay_payment_id:
        order.payment_status = PaymentStatus.REFUNDED
        order.refund_status = "REFUNDED"
        order.refund_id = f"COD_RETURN_{order.id}"
        return_note = f"[COD RETURN PROCESSED]: Customer requested return.{reason_str} COD refund marked as completed. Stock restored to batches."
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
        # Idempotent: Order is already refunded
        return order

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
            restock_order_inventory(db, order, reason_prefix="Admin Refund Restock")
        elif order.order_status not in [OrderStatus.CANCELLED, OrderStatus.RETURNED]:
            order.order_status = OrderStatus.CANCELLED
            restock_order_inventory(db, order, reason_prefix="Admin Refund Restock")

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
            restock_order_inventory(db, order, reason_prefix="Admin Refund Restock")
        db.commit()
        db.refresh(order)
        return order

    # Case C: Online Razorpay order with valid payment
    success, msg, refund_ref = initiate_razorpay_refund(db, order, amount_inr=req.amount, reason=req.reason)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )

    return order
