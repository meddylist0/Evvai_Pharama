"""
PharmaLink Enterprise — Legacy Inventory Migration Unit Test Suite.

Verifies all 9 core migration safety requirements:
1. Product with stock, batch_no, expiry_date -> creates ProductBatch with exact quantity.
2. Running migration twice -> idempotent (no duplicates or doubled stock).
3. Product with stock > 0 but missing batch_no -> manual review.
4. Product with stock > 0 but missing expiry -> manual review.
5. Product with zero stock -> skipped cleanly.
6. Existing ProductBatch -> no duplicate created.
7. Invalid expiry date -> manual review.
8. Multiple real existing batches -> preserved without merge or overwrite.
9. Existing batch quantity mismatch vs Product.stock -> reported as conflict.
"""

import sys
import os
import unittest
from datetime import datetime

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Force isolated test database for migration tests
MIGRATION_TEST_DB = os.path.join(BACKEND_DIR, "migration_test.db").replace("\\", "/")
os.environ["DATABASE_URL"] = f"sqlite:///{MIGRATION_TEST_DB}"

from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.models.product import Product, ProductBatch, InventoryTransaction
from migrate_legacy_inventory import run_migration, verify_post_migration


class TestLegacyInventoryMigration(unittest.TestCase):
    def setUp(self):
        # Create fresh schema for each test
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        self.db: Session = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_valid_legacy_product_migration(self):
        """Case 1: Valid product with stock=4190, batch_no='EVX-NTX-002', expiry='10/2028'."""
        prod = Product(
            sku="MIG-001",
            name="Nerve Boost Injection",
            composition="Mecobalamin 1500mcg",
            pack_size="5x2ml",
            mrp=290.0,
            customer_price=245.0,
            distributor_price=175.0,
            bulk_price=155.0,
            stock=4190,
            batch_no="EVX-NTX-002",
            expiry_date="10/2028",
            status="active"
        )
        self.db.add(prod)
        self.db.commit()
        self.db.refresh(prod)

        res = run_migration(self.db, dry_run=False)
        m = res["metrics"]

        self.assertEqual(m["scanned"], 1)
        self.assertEqual(m["eligible"], 1)
        self.assertEqual(m["created_batches"], 1)

        batch = self.db.query(ProductBatch).filter(ProductBatch.product_id == prod.id).first()
        self.assertIsNotNone(batch)
        self.assertEqual(batch.batch_no, "EVX-NTX-002")
        self.assertEqual(batch.expiry_date, "10/2028")
        self.assertEqual(batch.quantity, 4190)
        self.assertEqual(batch.status, "active")

        # Verify InventoryTransaction ledger entry
        txn = self.db.query(InventoryTransaction).filter(InventoryTransaction.product_id == prod.id).first()
        self.assertIsNotNone(txn)
        self.assertEqual(txn.transaction_type, "LEGACY_MIGRATION")
        self.assertEqual(txn.quantity, 4190)

    def test_02_idempotency_running_twice(self):
        """Case 2: Running migration twice does NOT duplicate batches or double stock."""
        prod = Product(
            sku="MIG-002",
            name="Sleep Well Spray",
            composition="Melatonin 5mg",
            pack_size="30ml",
            mrp=450.0,
            customer_price=395.0,
            distributor_price=280.0,
            bulk_price=250.0,
            stock=3500,
            batch_no="EV2026-Z01",
            expiry_date="12/2028",
            status="active"
        )
        self.db.add(prod)
        self.db.commit()

        # Run 1
        run_migration(self.db, dry_run=False)
        batch_count_1 = self.db.query(ProductBatch).filter(ProductBatch.product_id == prod.id).count()
        self.assertEqual(batch_count_1, 1)

        # Run 2
        res2 = run_migration(self.db, dry_run=False)
        batch_count_2 = self.db.query(ProductBatch).filter(ProductBatch.product_id == prod.id).count()

        self.assertEqual(batch_count_2, 1)
        self.assertEqual(res2["metrics"]["already_migrated"], 1)
        self.assertEqual(res2["metrics"]["created_batches"], 0)

        # Verify stock not doubled
        batch = self.db.query(ProductBatch).filter(ProductBatch.product_id == prod.id).first()
        self.assertEqual(batch.quantity, 3500)

    def test_03_missing_batch_no_manual_review(self):
        """Case 3: Product with stock > 0 but missing batch_no -> manual review required."""
        prod = Product(
            sku="MIG-003",
            name="No Batch Product",
            composition="Sample Comp",
            pack_size="10s",
            mrp=100.0,
            customer_price=90.0,
            distributor_price=70.0,
            bulk_price=60.0,
            stock=150,
            batch_no=None,
            expiry_date="12/2028",
            status="active"
        )
        self.db.add(prod)
        self.db.commit()

        res = run_migration(self.db, dry_run=False)
        self.assertEqual(res["metrics"]["manual_review_required"], 1)
        batch_count = self.db.query(ProductBatch).filter(ProductBatch.product_id == prod.id).count()
        self.assertEqual(batch_count, 0)

    def test_04_missing_expiry_date_manual_review(self):
        """Case 4: Product with stock > 0 but missing expiry -> manual review required."""
        prod = Product(
            sku="MIG-004",
            name="No Expiry Product",
            composition="Sample Comp",
            pack_size="10s",
            mrp=100.0,
            customer_price=90.0,
            distributor_price=70.0,
            bulk_price=60.0,
            stock=200,
            batch_no="BATCH-004",
            expiry_date=None,
            status="active"
        )
        self.db.add(prod)
        self.db.commit()

        res = run_migration(self.db, dry_run=False)
        self.assertEqual(res["metrics"]["manual_review_required"], 1)
        batch_count = self.db.query(ProductBatch).filter(ProductBatch.product_id == prod.id).count()
        self.assertEqual(batch_count, 0)

    def test_05_zero_stock_skipped(self):
        """Case 5: Product with zero stock -> skipped cleanly."""
        prod = Product(
            sku="MIG-005",
            name="Zero Stock Product",
            composition="Sample Comp",
            pack_size="10s",
            mrp=100.0,
            customer_price=90.0,
            distributor_price=70.0,
            bulk_price=60.0,
            stock=0,
            batch_no="BATCH-005",
            expiry_date="12/2028",
            status="active"
        )
        self.db.add(prod)
        self.db.commit()

        res = run_migration(self.db, dry_run=False)
        self.assertEqual(res["metrics"]["skipped_zero_stock"], 1)
        batch_count = self.db.query(ProductBatch).filter(ProductBatch.product_id == prod.id).count()
        self.assertEqual(batch_count, 0)

    def test_06_existing_batch_untouched(self):
        """Case 6: Product with matching existing ProductBatch -> untouched."""
        prod = Product(
            sku="MIG-006",
            name="Pre-Existing Batch Product",
            composition="Sample Comp",
            pack_size="10s",
            mrp=100.0,
            customer_price=90.0,
            distributor_price=70.0,
            bulk_price=60.0,
            stock=500,
            batch_no="PRE-EXISTING-001",
            expiry_date="05/2028",
            status="active"
        )
        self.db.add(prod)
        self.db.flush()

        existing_b = ProductBatch(
            product_id=prod.id,
            batch_no="PRE-EXISTING-001",
            expiry_date="05/2028",
            expiry_date_val=datetime(2028, 5, 31, 23, 59, 59),
            quantity=500,
            status="active"
        )
        self.db.add(existing_b)
        self.db.commit()

        res = run_migration(self.db, dry_run=False)
        self.assertEqual(res["metrics"]["already_migrated"], 1)
        self.assertEqual(res["metrics"]["created_batches"], 0)

    def test_07_invalid_expiry_format_manual_review(self):
        """Case 7: Invalid expiry date format -> manual review required."""
        prod = Product(
            sku="MIG-007",
            name="Bad Expiry Product",
            composition="Sample Comp",
            pack_size="10s",
            mrp=100.0,
            customer_price=90.0,
            distributor_price=70.0,
            bulk_price=60.0,
            stock=100,
            batch_no="BATCH-007",
            expiry_date="INVALID-DATE-99999",
            status="active"
        )
        self.db.add(prod)
        self.db.commit()

        res = run_migration(self.db, dry_run=False)
        self.assertEqual(res["metrics"]["manual_review_required"], 1)
        batch_count = self.db.query(ProductBatch).filter(ProductBatch.product_id == prod.id).count()
        self.assertEqual(batch_count, 0)

    def test_08_multiple_real_batches_preserved(self):
        """Case 8: Existing multiple real batches -> not overwritten or merged."""
        prod = Product(
            sku="MIG-008",
            name="Multi Batch Product",
            composition="Sample Comp",
            pack_size="10s",
            mrp=100.0,
            customer_price=90.0,
            distributor_price=70.0,
            bulk_price=60.0,
            stock=300,
            batch_no="BATCH-A",
            expiry_date="05/2027",
            status="active"
        )
        self.db.add(prod)
        self.db.flush()

        b1 = ProductBatch(
            product_id=prod.id,
            batch_no="BATCH-A",
            expiry_date="05/2027",
            quantity=100,
            status="active"
        )
        b2 = ProductBatch(
            product_id=prod.id,
            batch_no="BATCH-B",
            expiry_date="12/2027",
            quantity=200,
            status="active"
        )
        self.db.add(b1)
        self.db.add(b2)
        self.db.commit()

        res = run_migration(self.db, dry_run=False)
        # BATCH-A exists but quantity differs (100 != 300) -> reported as conflict
        self.assertEqual(res["metrics"]["conflicts"], 1)
        # BATCH-B remains untouched
        b2_check = self.db.query(ProductBatch).filter(ProductBatch.id == b2.id).first()
        self.assertEqual(b2_check.quantity, 200)

    def test_09_existing_batch_quantity_mismatch_conflict(self):
        """Case 9: Existing ProductBatch quantity differs from Product.stock -> conflict reported."""
        prod = Product(
            sku="MIG-009",
            name="Conflict Product",
            composition="Sample Comp",
            pack_size="10s",
            mrp=100.0,
            customer_price=90.0,
            distributor_price=70.0,
            bulk_price=60.0,
            stock=500,
            batch_no="BATCH-CONF",
            expiry_date="08/2028",
            status="active"
        )
        self.db.add(prod)
        self.db.flush()

        b = ProductBatch(
            product_id=prod.id,
            batch_no="BATCH-CONF",
            expiry_date="08/2028",
            quantity=250,  # 250 != 500
            status="active"
        )
        self.db.add(b)
        self.db.commit()

        res = run_migration(self.db, dry_run=False)
        self.assertEqual(res["metrics"]["conflicts"], 1)
        # Quantity remains untouched
        b_check = self.db.query(ProductBatch).filter(ProductBatch.id == b.id).first()
        self.assertEqual(b_check.quantity, 250)


if __name__ == "__main__":
    unittest.main()
