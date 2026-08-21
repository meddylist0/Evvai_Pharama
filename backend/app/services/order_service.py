import random
from datetime import datetime
from typing import List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.schemas.order import OrderCreateRequest, OrderItemCreate
from app.core.permissions import check_distributor_kyc_approved
from app.services.audit_service import record_audit


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
    if is_distributor and not check_distributor_kyc_approved(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Distributor KYC approval required for wholesale operations."
        )

    subtotal = 0.0
    tax_amount = 0.0
    item_details = []

    for item_req in items:
        if item_req.quantity <= 0:
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
            if item_req.quantity >= product.bulk_moq and product.bulk_price > 0:
                unit_price = product.bulk_price
            else:
                unit_price = product.distributor_price
        else:
            unit_price = product.customer_price

        item_total = round(unit_price * item_req.quantity, 2)
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
            "quantity": item_req.quantity,
            "total_price": item_total,
            "gst_rate": item_gst_rate,
            "tax": item_tax
        })

    subtotal = round(subtotal, 2)
    tax_amount = round(tax_amount, 2)
    shipping_charge = 0.0 if subtotal > 1000 or is_distributor else 50.0
    discount_amount = 0.0
    total_amount = round(subtotal + tax_amount + shipping_charge - discount_amount, 2)

    return subtotal, tax_amount, shipping_charge, total_amount, item_details


def create_order(db: Session, order_in: OrderCreateRequest, current_user: User) -> Order:
    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item."
        )

    is_distributor = current_user.role == UserRole.DISTRIBUTOR
    if is_distributor and not check_distributor_kyc_approved(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Distributor KYC approval required to place wholesale orders."
        )

    role_label = "Distributor" if is_distributor else "Retail Customer"
    order_code = generate_order_code()
    invoice_no = generate_invoice_number()

    subtotal, tax_amount, shipping_charge, total_amount, item_details = calculate_server_authoritative_amounts(
        db=db,
        items=order_in.items,
        current_user=current_user
    )

    order_items_to_create = []

    for item_data in item_details:
        # Atomic lock & inventory validation using conditional update
        rows_updated = db.query(Product).filter(
            Product.id == item_data["product_id"],
            Product.stock >= item_data["quantity"]
        ).update(
            {
                Product.stock: Product.stock - item_data["quantity"],
                Product.reserved_stock: Product.reserved_stock + item_data["quantity"]
            },
            synchronize_session="fetch"
        )

        if rows_updated == 0:
            product_check = db.query(Product).filter(Product.id == item_data["product_id"]).first()
            if not product_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item_data['product_id']} not found."
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for '{product_check.name}'. Available: {product_check.stock}, Requested: {item_data['quantity']}"
            )

        product = db.query(Product).filter(Product.id == item_data["product_id"]).first()

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

    # Never set payment_status = PAID based on payment_method name
    is_cod = order_in.payment_method and "cod" in order_in.payment_method.lower()
    initial_payment_status = PaymentStatus.COD if is_cod else PaymentStatus.PENDING
    initial_order_status = OrderStatus.CONFIRMED if (is_cod or is_distributor) else OrderStatus.PENDING

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
    db.commit()
    db.refresh(new_order)

    record_audit(
        db=db,
        action="ORDER_PLACED",
        module="ORDERS",
        details=f"Order {order_code} placed by {current_user.email} (Role: {role_label}) for ₹{total_amount}",
        user=current_user
    )

    return new_order

