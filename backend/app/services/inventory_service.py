from datetime import datetime, date
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.product import Product, ProductBatch, InventoryTransaction
from app.models.user import User

# ==============================================================================
# PHARMALINK ENTERPRISE — INVENTORY SERVICE (FEFO & LEDGER CORE)
# 
# Developer Notes for Team:
# 1. ProductBatch is the SINGLE SOURCE OF TRUTH for stock. Never update
#    Product.stock manually; always call sync_product_master_stock().
# 2. FEFO (First Expiry, First Out) rules require sorting active batches by
#    expiry_date_val ASC. Expired or depleted batches are strictly excluded.
# 3. Always call db.flush() BEFORE running master stock sync queries so that
#    uncommitted session edits (e.g. status changes during restock) are visible to SQL.
# ==============================================================================

def parse_expiry_to_date(expiry_str: Optional[str]) -> Optional[datetime]:
    """
    Normalizes MM/YYYY, YYYY-MM, or YYYY-MM-DD strings into a standard 23:59:59 end-of-day
    datetime for database indexing and FEFO queries.
    
    NOTE: Using 23:59:59 guarantees that a batch expiring in 05/2027 remains valid
    until the very last second of May 31, 2027.
    """
    if not expiry_str or not str(expiry_str).strip():
        return None

    clean_str = str(expiry_str).strip()

    try:
        # Format: MM/YYYY (e.g. "12/2028")
        if "/" in clean_str:
            parts = clean_str.split("/")
            if len(parts) == 2:
                month, year = int(parts[0]), int(parts[1])
                if not (1 <= month <= 12 and 2000 <= year <= 2100):
                    raise ValueError(f"Invalid month/year in {clean_str}")
                if month in [1, 3, 5, 7, 8, 10, 12]:
                    day = 31
                elif month in [4, 6, 9, 11]:
                    day = 30
                else:
                    day = 29 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 28
                return datetime(year, month, day, 23, 59, 59)
        # Format: YYYY-MM-DD
        elif "-" in clean_str and len(clean_str.split("-")) == 3:
            parsed_dt = datetime.strptime(clean_str, "%Y-%m-%d")
            if not (2000 <= parsed_dt.year <= 2100):
                raise ValueError(f"Invalid year in {clean_str}")
            return parsed_dt.replace(hour=23, minute=59, second=59)
        # Format: YYYY-MM
        elif "-" in clean_str and len(clean_str.split("-")) == 2:
            parts = clean_str.split("-")
            year, month = int(parts[0]), int(parts[1])
            if not (1 <= month <= 12 and 2000 <= year <= 2100):
                raise ValueError(f"Invalid month/year in {clean_str}")
            if month in [1, 3, 5, 7, 8, 10, 12]:
                day = 31
            elif month in [4, 6, 9, 11]:
                day = 30
            else:
                day = 29 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 28
            return datetime(year, month, day, 23, 59, 59)
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid expiry date format: '{expiry_str}'. Expected MM/YYYY, YYYY-MM, or YYYY-MM-DD."
        ) from err

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Invalid expiry date format: '{expiry_str}'. Expected MM/YYYY, YYYY-MM, or YYYY-MM-DD."
    )


def sync_product_master_stock(db: Session, product: Product) -> None:
    """
    Recalculates product.stock summary from active non-expired batches,
    and points product.batch_no and product.expiry_date to the earliest-expiring active batch.
    
    IMPORTANT: db.flush() is executed first so uncommitted status updates
    (e.g., restocking a depleted batch back to 'active') are immediately seen by SQL.
    """
    db.flush()
    now = datetime.utcnow()
    active_batches = (
        db.query(ProductBatch)
        .filter(
            ProductBatch.product_id == product.id,
            ProductBatch.status == "active",
            ProductBatch.quantity > 0,
            (ProductBatch.expiry_date_val == None) | (ProductBatch.expiry_date_val >= now)
        )
        .order_by(ProductBatch.expiry_date_val.asc().nullslast())
        .all()
    )

    if active_batches:
        total_stock = sum(b.quantity for b in active_batches)
        earliest = active_batches[0]
        product.stock = total_stock
        product.batch_no = earliest.batch_no
        product.expiry_date = earliest.expiry_date
    else:
        # If all batches are depleted or expired, clear summary fields safely
        product.stock = 0
        product.batch_no = None
        product.expiry_date = None


def record_inventory_receipt(
    db: Session,
    product: Product,
    batch_no: str,
    expiry_date: str,
    quantity: int,
    warehouse: str = "Main Warehouse",
    storage_location: str = "Cleanroom A",
    mfg_date: Optional[str] = None,
    purchase_rate: Optional[float] = None,
    user: Optional[User] = None,
    reason: str = "Opening Stock / Purchase Order Receipt"
) -> Tuple[ProductBatch, InventoryTransaction]:
    """
    Receives inventory into a batch, records a RECEIPT transaction in the ledger,
    and updates the product master stock & FEFO batch metadata.
    NOTE: Does NOT commit transaction internally; caller must manage commit/rollback.
    """
    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Received stock quantity must be greater than zero."
        )

    if not batch_no or not batch_no.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch number is required for inventory receipt."
        )

    expiry_dt = parse_expiry_to_date(expiry_date)
    now = datetime.utcnow()

    if expiry_dt and expiry_dt < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot receive expired batch (Expiry: {expiry_date})."
        )

    # Check if this batch already exists for this product with row locking
    batch = (
        db.query(ProductBatch)
        .filter(
            ProductBatch.product_id == product.id,
            ProductBatch.batch_no == batch_no.strip()
        )
        .with_for_update()
        .first()
    )

    if not batch:
        batch = ProductBatch(
            product_id=product.id,
            batch_no=batch_no.strip(),
            mfg_date=mfg_date,
            expiry_date=expiry_date,
            expiry_date_val=expiry_dt,
            quantity=quantity,
            purchase_rate=purchase_rate,
            warehouse=warehouse,
            storage_location=storage_location,
            status="active"
        )
        db.add(batch)
        db.flush()
    else:
        # Check for conflicting expiry date on existing batch
        if batch.expiry_date_val and expiry_dt and abs((batch.expiry_date_val - expiry_dt).days) > 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Conflicting expiry date for existing batch '{batch_no}'. Existing: {batch.expiry_date}, Provided: {expiry_date}."
            )
        batch.quantity += quantity
        batch.expiry_date = expiry_date
        batch.expiry_date_val = expiry_dt
        if batch.quantity > 0:
            batch.status = "active"

    # Sync product master stock
    sync_product_master_stock(db, product)

    # Log inventory transaction ledger entry
    txn = InventoryTransaction(
        product_id=product.id,
        batch_id=batch.id,
        transaction_type="RECEIPT",
        quantity=quantity,
        balance_after=product.stock,
        reason=reason,
        user_id=user.id if user else None
    )
    db.add(txn)
    db.flush()

    return batch, txn


def deduct_fefo_stock(
    db: Session,
    product: Product,
    required_qty: int,
    transaction_type: str = "SALE",
    reason: str = "Customer / Distributor Order Allocation",
    user: Optional[User] = None
) -> List[Tuple[ProductBatch, int]]:
    """
    Deducts stock using FEFO (First Expiry, First Out) rules.
    
    DEVELOPER NOTES:
    - Uses with_for_update() row locking on ProductBatch rows to prevent race conditions
      when multiple customers order the same batch simultaneously.
    - Iterates over active batches in ascending order of expiry_date_val.
    - If a single batch cannot fulfill the order, stock is deducted across multiple batches,
      recording exact item allocation tuples for complete traceability.
    """
    if required_qty <= 0:
        return []

    now = datetime.utcnow()

    # Step 1: Fetch active non-expired batches with pessimistic DB row locking (FEFO Order!)
    batches = (
        db.query(ProductBatch)
        .filter(
            ProductBatch.product_id == product.id,
            ProductBatch.status == "active",
            ProductBatch.quantity > 0,
            (ProductBatch.expiry_date_val == None) | (ProductBatch.expiry_date_val >= now)
        )
        .order_by(ProductBatch.expiry_date_val.asc().nullslast())
        .with_for_update()
        .all()
    )

    # Step 2: Validate total available stock before making any mutations
    total_available = sum(b.quantity for b in batches)
    if total_available < required_qty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient active non-expired inventory for '{product.name}'. Available: {total_available}, Requested: {required_qty}"
        )

    # Step 3: Multi-batch allocation & running ledger calculation
    remaining_needed = required_qty
    allocations = []
    running_balance = product.stock

    for batch in batches:
        if remaining_needed <= 0:
            break
        deduct_qty = min(batch.quantity, remaining_needed)
        batch.quantity -= deduct_qty
        if batch.quantity == 0:
            batch.status = "depleted"
        remaining_needed -= deduct_qty
        running_balance -= deduct_qty
        allocations.append((batch, deduct_qty))

        # Record ledger transaction for this batch
        txn = InventoryTransaction(
            product_id=product.id,
            batch_id=batch.id,
            transaction_type=transaction_type,
            quantity=-deduct_qty,
            balance_after=running_balance,
            reason=f"{reason} (Batch {batch.batch_no})",
            user_id=user.id if user else None
        )
        db.add(txn)

    # Sync overall product stock
    sync_product_master_stock(db, product)
    db.flush()

    return allocations

