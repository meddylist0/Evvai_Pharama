from datetime import datetime
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
    StockAdjustRequest,
    BatchOut,
    BatchCreate,
    InventoryTransactionOut
)
from app.models.product import ProductBatch, InventoryTransaction
from app.services.pricing_service import resolve_product_pricing
from app.services.audit_service import record_audit
from app.services.inventory_service import (
    record_inventory_receipt,
    deduct_fefo_stock,
    sync_product_master_stock
)

router = APIRouter()


# ─── Endpoints ─────────────────────────────────────────────────────

@router.get("", response_model=List[ProductDynamicOut])
def list_products(
    category_slug: Optional[str] = Query(None, description="Filter by category slug"),
    search: Optional[str] = Query(None, description="Search by product name, composition or SKU"),
    include_disabled: bool = Query(False, description="Include disabled items (Admin only)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Catalog Listing Endpoint with Dynamic Role-Based Pricing.
    
    DEVELOPER NOTES:
    - Resolves dynamic pricing (resolve_product_pricing) based on current_user role & KYC status.
    - Non-admin users only see 'active' products.
    """
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
    """
    Single Product Details Lookup Endpoint.
    
    DEVELOPER NOTES:
    - Applies resolve_product_pricing() so B2B rates are hidden from retail/guest users.
    """
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
    """
    Product Master & Opening Inventory Creation Endpoint.
    
    DEVELOPER NOTES:
    - Single transaction boundary: Creates Product master and opening ProductBatch atomically
      via record_inventory_receipt().
    - Enforces SKU uniqueness. Rejects creation with opening stock if batch_no or expiry_date is missing.
    """
    existing = db.query(Product).filter(Product.sku == prod_in.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{prod_in.sku}' already exists."
        )

    prod_data = prod_in.model_dump(exclude={"opening_inventory"})

    # Determine opening inventory details
    opening_inv = prod_in.opening_inventory
    init_stock = opening_inv.quantity if opening_inv else (prod_data.pop("stock", 0) or 0)
    batch_no = opening_inv.batch_no if opening_inv else prod_data.pop("batch_no", None)
    expiry_date = opening_inv.expiry_date if opening_inv else prod_data.pop("expiry_date", None)
    mfg_date = opening_inv.mfg_date if opening_inv else None
    purchase_rate = opening_inv.purchase_rate if opening_inv else None
    warehouse = opening_inv.warehouse if opening_inv else "Main Warehouse"
    storage_location = opening_inv.storage_location if opening_inv else "Cleanroom A"

    # Require explicit batch and expiry if opening stock > 0
    if init_stock > 0 and (not batch_no or not expiry_date):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid batch_no and expiry_date are required when creating a product with opening stock."
        )

    # Initial master record has 0 stock before batch receipt
    prod_data["stock"] = 0
    prod_data["batch_no"] = None
    prod_data["expiry_date"] = None

    try:
        product = Product(**prod_data)
        db.add(product)
        db.flush()

        if init_stock > 0 and batch_no and expiry_date:
            record_inventory_receipt(
                db=db,
                product=product,
                batch_no=batch_no,
                expiry_date=expiry_date,
                quantity=init_stock,
                warehouse=warehouse,
                storage_location=storage_location,
                mfg_date=mfg_date,
                purchase_rate=purchase_rate,
                user=admin_user,
                reason="Opening Inventory Receipt on Product Registration"
            )

        record_audit(
            db=db,
            action="PRODUCT_CREATED",
            module="PRODUCTS",
            details=f"Created product master '{product.name}' (SKU: {product.sku}, Initial Stock: {product.stock})",
            user=admin_user
        )

        db.commit()
        db.refresh(product)
    except Exception:
        db.rollback()
        raise

    return resolve_product_pricing(product, admin_user)


@router.get("/{product_id}/batches", response_model=List[BatchOut])
def get_product_batches(
    product_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    batches = (
        db.query(ProductBatch)
        .filter(ProductBatch.product_id == product_id)
        .order_by(ProductBatch.expiry_date_val.asc().nullslast())
        .all()
    )
    return batches


@router.post("/{product_id}/batches", response_model=BatchOut, status_code=status.HTTP_201_CREATED)
def receive_product_batch(
    product_id: int,
    batch_in: BatchCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    try:
        batch, _ = record_inventory_receipt(
            db=db,
            product=product,
            batch_no=batch_in.batch_no,
            expiry_date=batch_in.expiry_date,
            quantity=batch_in.quantity,
            warehouse=batch_in.warehouse,
            storage_location=batch_in.storage_location,
            mfg_date=batch_in.mfg_date,
            purchase_rate=batch_in.purchase_rate,
            user=admin_user,
            reason=f"Stock Inward Receipt for Batch {batch_in.batch_no}"
        )

        record_audit(
            db=db,
            action="BATCH_RECEIVED",
            module="INVENTORY",
            details=f"Received +{batch_in.quantity} units for Batch '{batch_in.batch_no}' of Product '{product.name}'",
            user=admin_user
        )

        db.commit()
        db.refresh(batch)
    except Exception:
        db.rollback()
        raise

    return batch


@router.get("/{product_id}/ledger", response_model=List[InventoryTransactionOut])
def get_inventory_ledger(
    product_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    txns = (
        db.query(InventoryTransaction)
        .filter(InventoryTransaction.product_id == product_id)
        .order_by(InventoryTransaction.created_at.desc())
        .all()
    )
    return txns


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

    update_dict = prod_in.model_dump(exclude_unset=True)

    # Prevent direct modification of inventory fields via ProductUpdate
    update_dict.pop("stock", None)
    update_dict.pop("batch_no", None)
    update_dict.pop("expiry_date", None)

    if "sku" in update_dict and update_dict["sku"] != product.sku:
        existing = db.query(Product).filter(Product.sku == update_dict["sku"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{update_dict['sku']}' already exists."
            )

    for field, val in update_dict.items():
        setattr(product, field, val)

    db.commit()
    db.refresh(product)

    record_audit(
        db=db,
        action="PRODUCT_UPDATED",
        module="PRODUCTS",
        details=f"Updated product master '{product.name}' (ID: {product_id})",
        user=admin_user
    )

    return resolve_product_pricing(product, admin_user)

from app.models.order import OrderItem


@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
def disable_or_delete_product(
    product_id: int,
    hard_delete: bool = Query(
        False,
        description="Permanently delete product if it has no inventory or order history."
    ),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Product Disabling or Hard-Deletion Endpoint.
    
    DEVELOPER NOTES:
    - HARD DELETE PROTECTION: If hard_delete=True, checks ProductBatch, InventoryTransaction,
      and OrderItem tables. If ANY history exists, returns HTTP 400 instructing admin to disable
      the product instead, preventing orphaned financial/accounting records.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if hard_delete:
        # Cascade delete associated batches, inventory transactions, and order item references
        db.query(ProductBatch).filter(ProductBatch.product_id == product_id).delete(synchronize_session=False)
        db.query(InventoryTransaction).filter(InventoryTransaction.product_id == product_id).delete(synchronize_session=False)
        db.query(OrderItem).filter(OrderItem.product_id == product_id).delete(synchronize_session=False)

        product_name = product.name
        db.delete(product)
        db.commit()

        record_audit(
            db=db,
            action="PRODUCT_HARD_DELETED",
            module="PRODUCTS",
            details=f"Hard deleted product '{product_name}' (ID: {product_id}) and cleaned associated records.",
            user=admin_user
        )

        return {
            "message": "Product permanently deleted",
            "id": product_id
        }

    product.status = "disabled"
    db.commit()

    record_audit(
        db=db,
        action="PRODUCT_DISABLED",
        module="PRODUCTS",
        details=f"Disabled product '{product.name}' (ID: {product_id})",
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
    """
    Manual Stock Adjustment Endpoint (Inward Addition or Outward FEFO Deduction).
    
    DEVELOPER NOTES:
    - Positive adjustment (> 0): Calls record_inventory_receipt() to create/update batch and log RECEIPT ledger.
    - Negative adjustment (< 0): Calls deduct_fefo_stock() to deduct stock via FEFO and log ADJUSTMENT_DEDUCT ledger.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    try:
        if req.adjustment > 0:
            batch_code = req.batch_no or product.batch_no
            if not batch_code:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Batch number is required for stock inward adjustment."
                )

            # Look up existing batch to inherit expiry if not provided
            existing_batch = db.query(ProductBatch).filter(
                ProductBatch.product_id == product.id,
                ProductBatch.batch_no == batch_code
            ).first()

            expiry = existing_batch.expiry_date if existing_batch else product.expiry_date
            if not expiry:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Expiry date is required for new batch inward adjustment."
                )

            record_inventory_receipt(
                db=db,
                product=product,
                batch_no=batch_code,
                expiry_date=expiry,
                quantity=req.adjustment,
                user=admin_user,
                reason=req.reason or "Manual Stock Inward Adjustment"
            )
        elif req.adjustment < 0:
            deduct_qty = abs(req.adjustment)
            deduct_fefo_stock(
                db=db,
                product=product,
                required_qty=deduct_qty,
                transaction_type="ADJUSTMENT_DEDUCT",
                reason=req.reason or "Manual Stock Outward Deduction",
                user=admin_user
            )

        db.commit()
        db.refresh(product)
    except Exception:
        db.rollback()
        raise

    return resolve_product_pricing(product, admin_user)


