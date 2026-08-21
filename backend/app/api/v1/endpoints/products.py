from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user_optional, require_admin
from app.models.user import User
from app.models.product import Product, Category
from app.schemas.product import (
    ProductDynamicOut,
    ProductCreate,
    ProductUpdate,
    StockAdjustRequest
)
from app.services.pricing_service import resolve_product_pricing
from app.services.audit_service import record_audit

router = APIRouter()


@router.get("", response_model=List[ProductDynamicOut])
def list_products(
    category_slug: Optional[str] = Query(None, description="Filter by category slug"),
    search: Optional[str] = Query(None, description="Search by product name, composition or SKU"),
    include_disabled: bool = Query(False, description="Include disabled items (Admin only)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(Product)

    if not include_disabled:
        query = query.filter(Product.status == "active")

    if category_slug:
        query = query.join(Category).filter(Category.slug == category_slug)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_pattern)) |
            (Product.composition.ilike(search_pattern)) |
            (Product.sku.ilike(search_pattern))
        )

    products = query.order_by(Product.id.asc()).all()
    return [resolve_product_pricing(p, current_user) for p in products]


@router.get("/{product_id}", response_model=ProductDynamicOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return resolve_product_pricing(product, current_user)


@router.post("", response_model=ProductDynamicOut, status_code=status.HTTP_201_CREATED)
def create_product(
    prod_in: ProductCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    existing = db.query(Product).filter(Product.sku == prod_in.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{prod_in.sku}' already exists."
        )

    product = Product(**prod_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)

    record_audit(
        db=db,
        action="PRODUCT_CREATED",
        module="PRODUCTS",
        details=f"Created product '{product.name}' (SKU: {product.sku})",
        user=admin_user
    )

    return resolve_product_pricing(product, admin_user)


@router.put("/{product_id}", response_model=ProductDynamicOut)
def update_product(
    product_id: int,
    prod_in: ProductUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    for field, val in prod_in.model_dump(exclude_unset=True).items():
        setattr(product, field, val)

    db.commit()
    db.refresh(product)

    record_audit(
        db=db,
        action="PRODUCT_UPDATED",
        module="PRODUCTS",
        details=f"Updated product '{product.name}' (ID: {product_id})",
        user=admin_user
    )

    return resolve_product_pricing(product, admin_user)

from app.models.order import OrderItem


@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
def disable_or_delete_product(
    product_id: int,
    hard_delete: bool = Query(
        False,
        description=(
            "Permanently delete the product while preserving "
            "historical order items and invoices."
        )
    ),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # =========================================================
    # HARD DELETE
    # =========================================================
    if hard_delete:
        product_name = product.name

        # Nullify product_id on historical OrderItems so invoices are preserved
        # (product_name, sku, batch_no, unit_price, quantity are already snapshot-stored)
        db.query(OrderItem).filter(OrderItem.product_id == product_id).update(
            {"product_id": None}, synchronize_session=False
        )

        db.delete(product)
        db.commit()

        record_audit(
            db=db,
            action="PRODUCT_HARD_DELETED",
            module="PRODUCTS",
            details=f"Hard deleted product '{product_name}' (ID: {product_id}). OrderItem references nullified.",
            user=admin_user
        )

        return {
            "message": "Product and all references successfully updated/removed",
            "id": product_id
        }

    # =========================================================
    # SOFT DELETE / DISABLE
    # =========================================================
    product.status = "disabled"

    details = (
        f"Disabled product "
        f"'{product.name}' (ID: {product_id})"
    )

    db.commit()

    record_audit(
        db=db,
        action="PRODUCT_DISABLED",
        module="PRODUCTS",
        details=details,
        user=admin_user
    )

    return {
        "message": "Product disabled successfully",
        "id": product_id
    }
    
@router.post("/{product_id}/adjust-stock", response_model=ProductDynamicOut)
def adjust_stock(
    product_id: int,
    req: StockAdjustRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    new_stock = product.stock + req.adjustment
    if new_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Adjustment results in negative stock ({new_stock}). Available: {product.stock}"
        )

    product.stock = new_stock
    if req.batch_no:
        product.batch_no = req.batch_no

    db.commit()
    db.refresh(product)

    record_audit(
        db=db,
        action="STOCK_ADJUSTED",
        module="INVENTORY",
        details=f"Stock adjusted by {req.adjustment:+d} (New: {new_stock}) for '{product.name}'. Reason: {req.reason}",
        user=admin_user
    )

    return resolve_product_pricing(product, admin_user)
