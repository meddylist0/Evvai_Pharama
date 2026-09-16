#!/usr/bin/env python3
"""
# ==============================================================================
# PHARMALINK ENTERPRISE — LEGACY INVENTORY DATA MIGRATION SCRIPT
#
# Developer Notes for Team:
# 1. DO NOT INVENT DATA: If legacy Product.stock > 0 but batch_no or expiry_date is
#    missing/unparseable, tag it as 'manual_review_required'. Never invent fake strings!
# 2. IDEMPOTENCY GUARANTEE: Matches existing ProductBatch records by (product_id + batch_no).
#    Re-running this script will NOT create duplicate batches or double stock.
# 3. SAFETY FIRST: Use --dry-run to preview all metrics and sample records before committing.
# ==============================================================================
"""

import sys
import os
import argparse
from datetime import datetime
from typing import Dict, Any, List

# Ensure backend directory is on sys.path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.core.database import SessionLocal, sync_db_schema
from app.models.product import Product, ProductBatch, InventoryTransaction
from app.services.inventory_service import parse_expiry_to_date, sync_product_master_stock


def run_migration(db: Session, dry_run: bool = True) -> Dict[str, Any]:
    """
    Executes the legacy inventory migration logic.
    Returns a dictionary of metrics, logs, sample records, and audit results.
    """
    sync_db_schema()

    products = db.query(Product).order_by(Product.id.asc()).all()

    metrics = {
        "scanned": len(products),
        "eligible": 0,
        "created_batches": 0,
        "already_migrated": 0,
        "skipped_zero_stock": 0,
        "manual_review_required": 0,
        "conflicts": 0,
    }

    logs: List[Dict[str, Any]] = []
    samples_created: List[Dict[str, Any]] = []
    samples_manual_review: List[Dict[str, Any]] = []

    now = datetime.utcnow()

    for product in products:
        # Case A: Stock <= 0 -> Skip
        if product.stock <= 0:
            metrics["skipped_zero_stock"] += 1
            logs.append({
                "product_id": product.id,
                "name": product.name,
                "status": "SKIPPED",
                "reason": f"Stock is {product.stock} (zero or negative stock)"
            })
            continue

        # Case C & D: Missing batch_no or expiry_date
        clean_batch_no = str(product.batch_no).strip() if product.batch_no else None
        clean_expiry_str = str(product.expiry_date).strip() if product.expiry_date else None

        if not clean_batch_no:
            metrics["manual_review_required"] += 1
            entry = {
                "product_id": product.id,
                "name": product.name,
                "status": "MANUAL_REVIEW",
                "reason": "Legacy stock > 0 but batch_no is missing"
            }
            logs.append(entry)
            if len(samples_manual_review) < 5:
                samples_manual_review.append(entry)
            continue

        if not clean_expiry_str:
            metrics["manual_review_required"] += 1
            entry = {
                "product_id": product.id,
                "name": product.name,
                "status": "MANUAL_REVIEW",
                "reason": "Legacy stock > 0 but expiry_date is missing"
            }
            logs.append(entry)
            if len(samples_manual_review) < 5:
                samples_manual_review.append(entry)
            continue

        # Expiry Parsing
        try:
            expiry_dt = parse_expiry_to_date(clean_expiry_str)
            if not expiry_dt:
                raise ValueError("Parsed expiry datetime is None")
        except (HTTPException, ValueError, Exception) as err:
            metrics["manual_review_required"] += 1
            entry = {
                "product_id": product.id,
                "name": product.name,
                "status": "MANUAL_REVIEW",
                "reason": f"Unparseable expiry_date format '{clean_expiry_str}': {err}"
            }
            logs.append(entry)
            if len(samples_manual_review) < 5:
                samples_manual_review.append(entry)
            continue

        # Case E: Uniqueness & Conflict Check
        existing_batch = (
            db.query(ProductBatch)
            .filter(
                ProductBatch.product_id == product.id,
                ProductBatch.batch_no == clean_batch_no
            )
            .first()
        )

        if existing_batch:
            if existing_batch.quantity == product.stock:
                metrics["already_migrated"] += 1
                logs.append({
                    "product_id": product.id,
                    "name": product.name,
                    "status": "ALREADY_MIGRATED",
                    "reason": f"ProductBatch '{clean_batch_no}' already exists with matching quantity ({product.stock})"
                })
            else:
                metrics["conflicts"] += 1
                logs.append({
                    "product_id": product.id,
                    "name": product.name,
                    "status": "CONFLICT",
                    "reason": f"Existing batch '{clean_batch_no}' quantity ({existing_batch.quantity}) differs from legacy product stock ({product.stock})"
                })
            continue

        # Case B: Eligible for migration
        metrics["eligible"] += 1
        batch_status = "active" if (expiry_dt >= now) else "expired"

        new_batch = ProductBatch(
            product_id=product.id,
            batch_no=clean_batch_no,
            expiry_date=clean_expiry_str,
            expiry_date_val=expiry_dt,
            quantity=product.stock,
            reserved_quantity=0,
            purchase_rate=None,
            warehouse="Main Warehouse",
            storage_location="Cleanroom A",
            status=batch_status
        )

        sample_info = {
            "product_id": product.id,
            "name": product.name,
            "batch_no": clean_batch_no,
            "expiry_date": clean_expiry_str,
            "quantity": product.stock,
            "status": batch_status
        }
        if len(samples_created) < 5:
            samples_created.append(sample_info)

        if not dry_run:
            db.add(new_batch)
            db.flush()

            txn = InventoryTransaction(
                product_id=product.id,
                batch_id=new_batch.id,
                transaction_type="LEGACY_MIGRATION",
                quantity=product.stock,
                balance_after=product.stock,
                reason=f"Legacy inventory data migration for Product '{product.name}' (Batch {clean_batch_no})",
                user_id=None
            )
            db.add(txn)

            sync_product_master_stock(db, product)
            metrics["created_batches"] += 1

    if dry_run:
        db.rollback()
    else:
        db.commit()

    return {
        "dry_run": dry_run,
        "metrics": metrics,
        "logs": logs,
        "samples_created": samples_created,
        "samples_manual_review": samples_manual_review
    }


def verify_post_migration(db: Session) -> Dict[str, int]:
    """
    Runs 7 database integrity verification queries after migration.
    Returns counts for all verification criteria.
    """
    now = datetime.utcnow()

    # 1. Products with stock > 0 but no ProductBatch records
    subq = db.query(ProductBatch.product_id).distinct()
    prods_without_batches = (
        db.query(Product)
        .filter(Product.stock > 0, ~Product.id.in_(subq))
        .count()
    )

    # 2. Products with batch_no set but no matching ProductBatch
    prods_with_unmigrated_batch_no = 0
    prods_with_batch = db.query(Product).filter(Product.stock > 0, Product.batch_no != None).all()
    for p in prods_with_batch:
        if p.batch_no and str(p.batch_no).strip():
            b = db.query(ProductBatch).filter(ProductBatch.product_id == p.id, ProductBatch.batch_no == str(p.batch_no).strip()).first()
            if not b:
                prods_with_unmigrated_batch_no += 1

    # 3. Products with expiry_date set but no matching ProductBatch
    prods_with_unmigrated_expiry = 0
    prods_with_exp = db.query(Product).filter(Product.stock > 0, Product.expiry_date != None).all()
    for p in prods_with_exp:
        if p.expiry_date and str(p.expiry_date).strip():
            b = db.query(ProductBatch).filter(ProductBatch.product_id == p.id).first()
            if not b:
                prods_with_unmigrated_expiry += 1

    # 4. Orphaned ProductBatch records
    all_product_ids = db.query(Product.id).subquery()
    orphaned_batches = db.query(ProductBatch).filter(~ProductBatch.product_id.in_(all_product_ids)).count()

    # 5. Duplicate ProductBatch records (product_id + batch_no)
    duplicates = (
        db.query(ProductBatch.product_id, ProductBatch.batch_no, func.count(ProductBatch.id))
        .group_by(ProductBatch.product_id, ProductBatch.batch_no)
        .having(func.count(ProductBatch.id) > 1)
        .count()
    )

    # 6. Stock value conflicts between Product.stock and sum of active non-expired ProductBatch.quantity
    stock_conflicts = 0
    for p in db.query(Product).all():
        active_sum = (
            db.query(func.coalesce(func.sum(ProductBatch.quantity), 0))
            .filter(
                ProductBatch.product_id == p.id,
                ProductBatch.status == "active",
                ProductBatch.quantity > 0,
                (ProductBatch.expiry_date_val == None) | (ProductBatch.expiry_date_val >= now)
            )
            .scalar()
        )
        if p.stock != active_sum:
            stock_conflicts += 1

    # 7. Active batches that are expired
    expired_active_batches = (
        db.query(ProductBatch)
        .filter(
            ProductBatch.status == "active",
            ProductBatch.expiry_date_val != None,
            ProductBatch.expiry_date_val < now
        )
        .count()
    )

    return {
        "prods_without_batches": prods_without_batches,
        "prods_with_unmigrated_batch_no": prods_with_unmigrated_batch_no,
        "prods_with_unmigrated_expiry": prods_with_unmigrated_expiry,
        "orphaned_batches": orphaned_batches,
        "duplicate_batches": duplicates,
        "stock_conflicts": stock_conflicts,
        "expired_active_batches": expired_active_batches,
    }


def main():
    parser = argparse.ArgumentParser(description="Legacy Pharma Inventory Data Migration Script")
    parser.add_argument("--dry-run", action="store_true", default=False, help="Run migration in dry-run mode (make 0 DB changes)")
    parser.add_argument("--commit", action="store_true", default=False, help="Commit migration changes to database")
    args = parser.parse_args()

    dry_run = not args.commit
    if args.dry_run:
        dry_run = True

    mode_label = "DRY RUN MODE" if dry_run else "COMMIT EXECUTION MODE"
    print("==================================================")
    print(f"   Legacy Inventory Data Migration - {mode_label}")
    print("==================================================")

    db = SessionLocal()
    try:
        results = run_migration(db, dry_run=dry_run)
        m = results["metrics"]

        print(f"\nScan Summary:")
        print(f"  Products Scanned            : {m['scanned']}")
        print(f"  Eligible for Migration       : {m['eligible']}")
        print(f"  Already Migrated             : {m['already_migrated']}")
        print(f"  Skipped (Zero/Negative Stock): {m['skipped_zero_stock']}")
        print(f"  Manual Review Required      : {m['manual_review_required']}")
        print(f"  Conflicts Detected          : {m['conflicts']}")

        if dry_run:
            print(f"  ProductBatch Records Created : 0 (DRY RUN)")
        else:
            print(f"  ProductBatch Records Created : {m['created_batches']}")

        if results["samples_created"]:
            print("\nSample Created Batches:")
            for s in results["samples_created"]:
                print(f"  - Product #{s['product_id']} '{s['name']}': Batch '{s['batch_no']}', Exp: '{s['expiry_date']}', Qty: {s['quantity']}, Status: {s['status']}")

        if results["samples_manual_review"]:
            print("\nSample Items Requiring Manual Review:")
            for s in results["samples_manual_review"]:
                print(f"  - Product #{s['product_id']} '{s['name']}': {s['reason']}")

        if not dry_run:
            print("\n--------------------------------------------------")
            print("Post-Migration Database Verification Report:")
            print("--------------------------------------------------")
            ver = verify_post_migration(db)
            print(f"  Products with stock > 0 but 0 ProductBatch records: {ver['prods_without_batches']}")
            print(f"  Products with unmigrated legacy batch_no        : {ver['prods_with_unmigrated_batch_no']}")
            print(f"  Products with unmigrated legacy expiry_date     : {ver['prods_with_unmigrated_expiry']}")
            print(f"  Orphaned ProductBatch records                  : {ver['orphaned_batches']}")
            print(f"  Duplicate ProductBatch records (product+batch)  : {ver['duplicate_batches']}")
            print(f"  Product.stock vs Batch Sum mismatches           : {ver['stock_conflicts']}")
            print(f"  Active ProductBatch records that are expired    : {ver['expired_active_batches']}")
            print("\nMigration completed successfully!")
        else:
            print("\nDRY RUN complete. No database changes were made.")
            print("To execute migration, run: python migrate_legacy_inventory.py --commit")

    except Exception as err:
        db.rollback()
        print(f"\n[ERROR] Migration failed with error: {err}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
