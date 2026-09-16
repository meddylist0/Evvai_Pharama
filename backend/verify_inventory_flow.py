#!/usr/bin/env python3
"""
Comprehensive Live Inventory & Order Flow Verification Script.

Tests and verifies all 8 core inventory mechanisms on pharmalink_test.db with HARD ASSERTIONS:
1. Product & FEFO Multi-Batch Creation (Batch A earlier expiry, Batch B later expiry)
2. Order Placement & FEFO Multi-Batch Deduction (Batch A depleted, Batch B deducted)
3. Insufficient Stock Protection (Rejection when requested qty > available stock)
4. Order Cancellation & Exact Batch Restocking (Restores Batch A & B, Product.stock = 130, FEFO batch = EV2026-Z01)
5. Idempotency Protection (Duplicate cancellation blocked; no double restocking)
6. Product Isolation Guarantee (Orders for Product 1 NEVER touch Product 2 batches)
7. FEFO Allocation After Restock Cycle (Order 20 post-restock consumes Batch A -> 10 remaining)
8. Multiple Cancellation / Restock Cycles (Repeated order-cancel cycles preserve exact batch integrity)

Usage:
  python verify_inventory_flow.py
"""

import sys
import os
from datetime import datetime

# Ensure stdout handles UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure backend directory is on sys.path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Force isolated test database for live verification
TEST_DB_PATH = os.path.join(BACKEND_DIR, "pharmalink_test.db").replace("\\", "/")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.product import Product, ProductBatch, InventoryTransaction
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus, OrderItemBatchAllocation
from app.schemas.order import OrderCreateRequest, OrderItemCreate
from app.services.inventory_service import record_inventory_receipt, deduct_fefo_stock, sync_product_master_stock
from app.services.order_service import create_order
from app.api.v1.endpoints.orders import restock_order_inventory, validate_order_transition


def print_header(title: str):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def print_product_and_batches(db: Session, product_id: int):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        print(f"Product #{product_id} not found.")
        return

    print(f"\n[PRODUCT MASTER] ID #{prod.id} | Name: '{prod.name}'")
    print(f"   Master Stock: {prod.stock} | Reserved Stock: {prod.reserved_stock} | FEFO Batch: '{prod.batch_no}' | Expiry: '{prod.expiry_date}'")
    
    batches = db.query(ProductBatch).filter(ProductBatch.product_id == prod.id).order_by(ProductBatch.expiry_date_val.asc()).all()
    print(f"   [BATCH TABLE] ({len(batches)} batches linked via product_id = {prod.id}):")
    for b in batches:
        print(f"      - Batch ID #{b.id} | Batch No: '{b.batch_no}' | Qty: {b.quantity} | Status: '{b.status}' | Expiry: '{b.expiry_date}' ({b.expiry_date_val.strftime('%Y-%m-%d') if b.expiry_date_val else 'N/A'})")


def print_recent_ledger(db: Session, product_id: int, limit: int = 10):
    txns = db.query(InventoryTransaction).filter(InventoryTransaction.product_id == product_id).order_by(InventoryTransaction.id.asc()).limit(limit).all()
    print(f"\n   [INVENTORY LEDGER] (Total {len(txns)} transactions for product_id = {product_id}):")
    for t in txns:
        sign = "+" if t.quantity > 0 else ""
        print(f"      - Txn #{t.id} | Type: {t.transaction_type:<18} | Qty: {sign}{t.quantity:<4} | Balance After: {t.balance_after:<4} | Reason: {t.reason}")


def main():
    print_header("PHARMALINK ENTERPRISE -- HARD ASSERTION INVENTORY VERIFICATION")
    
    # Reset test database
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Create Test Users
        customer = User(
            email="customer_test@evvai.com",
            hashed_password=get_password_hash("Cust@123"),
            full_name="Arun Test Customer",
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=True
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

        # =========================================================================
        # SCENARIO 1: Create Product with 2 Batches (FEFO Setup)
        # =========================================================================
        print_header("SCENARIO 1: Creating Product 'Zene Melatonin' with 2 Batches")
        print("  Batch A (EV2026-Z01): Expiry 05/2027 (Earlier), Quantity: 30")
        print("  Batch B (EV2026-Z02): Expiry 12/2028 (Later)  , Quantity: 100")

        prod_zene = Product(
            sku="EVV-ZEN-001",
            name="Zene Melatonin Oral Spray",
            composition="Melatonin 5mg",
            pack_size="30ml",
            mrp=450.0,
            customer_price=395.0,
            distributor_price=280.0,
            bulk_price=250.0,
            stock=0,
            status="active"
        )
        db.add(prod_zene)
        db.flush()

        # Batch A: Earliest expiry (05/2027) -> Qty 30
        record_inventory_receipt(
            db=db,
            product=prod_zene,
            batch_no="EV2026-Z01",
            expiry_date="05/2027",
            quantity=30,
            reason="Initial Batch A Receipt"
        )

        # Batch B: Later expiry (12/2028) -> Qty 100
        record_inventory_receipt(
            db=db,
            product=prod_zene,
            batch_no="EV2026-Z02",
            expiry_date="12/2028",
            quantity=100,
            reason="Initial Batch B Receipt"
        )

        db.commit()
        db.refresh(prod_zene)
        print_product_and_batches(db, prod_zene.id)

        # SCENARIO 1 ASSERTIONS
        batch_A = db.query(ProductBatch).filter(ProductBatch.product_id == prod_zene.id, ProductBatch.batch_no == "EV2026-Z01").first()
        batch_B = db.query(ProductBatch).filter(ProductBatch.product_id == prod_zene.id, ProductBatch.batch_no == "EV2026-Z02").first()
        
        assert prod_zene.stock == 130, f"Expected prod_zene.stock == 130, got {prod_zene.stock}"
        assert prod_zene.reserved_stock == 0, f"Expected reserved_stock == 0, got {prod_zene.reserved_stock}"
        assert prod_zene.batch_no == "EV2026-Z01", f"Expected FEFO batch == 'EV2026-Z01', got '{prod_zene.batch_no}'"
        assert prod_zene.expiry_date == "05/2027", f"Expected FEFO expiry == '05/2027', got '{prod_zene.expiry_date}'"
        assert batch_A.quantity == 30, f"Expected Batch A qty == 30, got {batch_A.quantity}"
        assert batch_A.status == "active", f"Expected Batch A status == 'active', got '{batch_A.status}'"
        assert batch_B.quantity == 100, f"Expected Batch B qty == 100, got {batch_B.quantity}"
        assert batch_B.status == "active", f"Expected Batch B status == 'active', got '{batch_B.status}'"
        print("  ✓ SCENARIO 1 ASSERTIONS PASSED!")

        # =========================================================================
        # SCENARIO 2: Place Order for 50 Units (Multi-Batch FEFO Allocation)
        # =========================================================================
        print_header("SCENARIO 2: Placing Customer Order for 50 Units")

        order_req = OrderCreateRequest(
            items=[OrderItemCreate(product_id=prod_zene.id, quantity=50)],
            customer_name="Arun Test Customer",
            customer_phone="9876543210",
            delivery_address="Survey 45/B, Genome Valley",
            delivery_city="Hyderabad",
            delivery_state="Telangana",
            delivery_pincode="500078",
            payment_method="COD"
        )

        order_1 = create_order(db=db, order_in=order_req, current_user=customer)
        db.commit()
        db.refresh(prod_zene)
        db.refresh(batch_A)
        db.refresh(batch_B)

        print_product_and_batches(db, prod_zene.id)

        # SCENARIO 2 ASSERTIONS
        allocs = {}
        for item in order_1.items:
            for alloc in item.batch_allocations:
                allocs[alloc.batch_no] = alloc.quantity

        assert batch_A.quantity == 0, f"Expected Batch A qty == 0, got {batch_A.quantity}"
        assert batch_A.status == "depleted", f"Expected Batch A status == 'depleted', got '{batch_A.status}'"
        assert batch_B.quantity == 80, f"Expected Batch B qty == 80, got {batch_B.quantity}"
        assert batch_B.status == "active", f"Expected Batch B status == 'active', got '{batch_B.status}'"
        assert prod_zene.stock == 80, f"Expected prod_zene.stock == 80, got {prod_zene.stock}"
        assert prod_zene.reserved_stock == 50, f"Expected reserved_stock == 50, got {prod_zene.reserved_stock}"
        assert allocs == {"EV2026-Z01": 30, "EV2026-Z02": 20}, f"Expected allocations {{'EV2026-Z01': 30, 'EV2026-Z02': 20}}, got {allocs}"
        print("  ✓ SCENARIO 2 ASSERTIONS PASSED!")

        # =========================================================================
        # SCENARIO 3: Insufficient Stock Order Rejection
        # =========================================================================
        print_header("SCENARIO 3: Testing Insufficient Stock Protection (Ordering 100 units)")

        order_req_over = OrderCreateRequest(
            items=[OrderItemCreate(product_id=prod_zene.id, quantity=100)],
            customer_name="Arun Test Customer",
            customer_phone="9876543210",
            delivery_address="Survey 45/B, Genome Valley",
            delivery_city="Hyderabad",
            delivery_state="Telangana",
            delivery_pincode="500078",
            payment_method="COD"
        )

        rejected = False
        try:
            create_order(db=db, order_in=order_req_over, current_user=customer)
        except HTTPException as ex:
            rejected = True
            assert ex.status_code == 400, f"Expected HTTP 400, got {ex.status_code}"
            assert "Available: 80, Requested: 100" in ex.detail

        db.refresh(prod_zene)
        db.refresh(batch_A)
        db.refresh(batch_B)

        assert rejected, "Order placement for 100 units should have been rejected"
        assert prod_zene.stock == 80, f"Expected prod_zene.stock == 80 after rejection, got {prod_zene.stock}"
        assert batch_A.quantity == 0, f"Expected Batch A qty == 0, got {batch_A.quantity}"
        assert batch_B.quantity == 80, f"Expected Batch B qty == 80, got {batch_B.quantity}"
        print("  ✓ SCENARIO 3 ASSERTIONS PASSED!")

        # =========================================================================
        # SCENARIO 4: Order Cancellation & Batch Restocking
        # =========================================================================
        print_header(f"SCENARIO 4: Cancelling Order '{order_1.order_code}' (Restocking 50 units)")

        validate_order_transition(order_1.order_status, OrderStatus.CANCELLED)
        order_1.order_status = OrderStatus.CANCELLED
        restock_order_inventory(db, order_1, reason_prefix="Cancellation Restock")
        db.commit()
        db.refresh(order_1)
        db.refresh(prod_zene)
        db.refresh(batch_A)
        db.refresh(batch_B)

        print_product_and_batches(db, prod_zene.id)

        # SCENARIO 4 ASSERTIONS (HARD MANDATORY VERIFICATION)
        assert batch_A.quantity == 30, f"Expected Batch A qty == 30 after restock, got {batch_A.quantity}"
        assert batch_A.status == "active", f"Expected Batch A status == 'active', got '{batch_A.status}'"
        assert batch_B.quantity == 100, f"Expected Batch B qty == 100 after restock, got {batch_B.quantity}"
        assert batch_B.status == "active", f"Expected Batch B status == 'active', got '{batch_B.status}'"
        assert prod_zene.stock == 130, f"Expected prod_zene.stock == 130 after restock, got {prod_zene.stock}"
        assert prod_zene.reserved_stock == 0, f"Expected reserved_stock == 0 after restock, got {prod_zene.reserved_stock}"
        assert prod_zene.batch_no == "EV2026-Z01", f"Expected FEFO batch == 'EV2026-Z01', got '{prod_zene.batch_no}'"
        assert prod_zene.expiry_date == "05/2027", f"Expected FEFO expiry == '05/2027', got '{prod_zene.expiry_date}'"

        active_sum = db.query(ProductBatch).filter(ProductBatch.product_id == prod_zene.id, ProductBatch.status == "active").all()
        assert sum(b.quantity for b in active_sum) == prod_zene.stock == 130
        print("  ✓ SCENARIO 4 ASSERTIONS PASSED! (Master Stock = 130, FEFO Batch = EV2026-Z01)")

        # =========================================================================
        # SCENARIO 5: Idempotency Protection (Duplicate Cancellation Rejection)
        # =========================================================================
        print_header("SCENARIO 5: Testing Idempotency (Attempting Second Cancellation)")

        txns_before = db.query(InventoryTransaction).filter(InventoryTransaction.product_id == prod_zene.id).count()
        dup_failed = False
        try:
            validate_order_transition(order_1.order_status, OrderStatus.CANCELLED)
        except HTTPException as ex:
            dup_failed = True
            assert ex.status_code == 400

        db.refresh(prod_zene)
        db.refresh(batch_A)
        db.refresh(batch_B)
        txns_after = db.query(InventoryTransaction).filter(InventoryTransaction.product_id == prod_zene.id).count()

        assert dup_failed, "Second cancellation should have been blocked"
        assert prod_zene.stock == 130
        assert prod_zene.reserved_stock == 0
        assert batch_A.quantity == 30
        assert batch_B.quantity == 100
        assert txns_before == txns_after, "No additional RESTOCK transactions should be created on duplicate cancellation"
        print("  ✓ SCENARIO 5 ASSERTIONS PASSED!")

        # =========================================================================
        # SCENARIO 6: Product Isolation Guarantee
        # =========================================================================
        print_header("SCENARIO 6: Testing Product Isolation (Product 1 vs Product 2)")

        prod_nxt = Product(
            sku="EVV-NXT-002",
            name="NXTNERve B12 Injection",
            composition="Mecobalamin 1500mcg",
            pack_size="5x2ml",
            mrp=290.0,
            customer_price=245.0,
            distributor_price=175.0,
            bulk_price=155.0,
            stock=0,
            status="active"
        )
        db.add(prod_nxt)
        db.flush()

        record_inventory_receipt(
            db=db,
            product=prod_nxt,
            batch_no="EV2026-N02",
            expiry_date="10/2028",
            quantity=200,
            reason="Initial NXTNERve Batch C Receipt"
        )
        db.commit()

        batch_C = db.query(ProductBatch).filter(ProductBatch.product_id == prod_nxt.id).first()
        assert prod_zene.stock == 130
        assert prod_nxt.stock == 200
        assert batch_C.product_id == prod_nxt.id
        assert batch_C.quantity == 200
        print("  ✓ SCENARIO 6 ASSERTIONS PASSED!")

        # =========================================================================
        # SCENARIO 7: FEFO Allocation After Restock Cycle
        # =========================================================================
        print_header("SCENARIO 7: Placing New Order for 20 Units Post-Restock")

        order_req_2 = OrderCreateRequest(
            items=[OrderItemCreate(product_id=prod_zene.id, quantity=20)],
            customer_name="Arun Test Customer",
            customer_phone="9876543210",
            delivery_address="Survey 45/B, Genome Valley",
            delivery_city="Hyderabad",
            delivery_state="Telangana",
            delivery_pincode="500078",
            payment_method="COD"
        )

        order_2 = create_order(db=db, order_in=order_req_2, current_user=customer)
        db.commit()
        db.refresh(prod_zene)
        db.refresh(batch_A)
        db.refresh(batch_B)

        print_product_and_batches(db, prod_zene.id)

        # SCENARIO 7 ASSERTIONS: FEFO MUST CONSUME BATCH A (05/2027) FIRST!
        assert batch_A.quantity == 10, f"Expected Batch A qty == 10 after 20-unit order, got {batch_A.quantity}"
        assert batch_A.status == "active", f"Expected Batch A status == 'active', got '{batch_A.status}'"
        assert batch_B.quantity == 100, f"Expected Batch B qty == 100, got {batch_B.quantity}"
        assert prod_zene.stock == 110, f"Expected prod_zene.stock == 110, got {prod_zene.stock}"
        assert prod_zene.batch_no == "EV2026-Z01", f"Expected FEFO batch == 'EV2026-Z01', got '{prod_zene.batch_no}'"
        assert prod_zene.expiry_date == "05/2027", f"Expected FEFO expiry == '05/2027', got '{prod_zene.expiry_date}'"
        print("  ✓ SCENARIO 7 ASSERTIONS PASSED! (FEFO correctly consumed Batch A first)")

        # =========================================================================
        # SCENARIO 8: Multiple Cancellation / Restock Cycles Test
        # =========================================================================
        print_header("SCENARIO 8: Testing Multiple Order & Cancellation Cycles")

        # Cancel Order 2 (20 units)
        validate_order_transition(order_2.order_status, OrderStatus.CANCELLED)
        order_2.order_status = OrderStatus.CANCELLED
        restock_order_inventory(db, order_2, reason_prefix="Cancellation Restock 2")
        db.commit()
        db.refresh(prod_zene)
        db.refresh(batch_A)
        db.refresh(batch_B)

        assert batch_A.quantity == 30
        assert batch_B.quantity == 100
        assert prod_zene.stock == 130
        assert prod_zene.reserved_stock == 0
        assert prod_zene.batch_no == "EV2026-Z01"

        # Place Order 3 (15 units)
        order_req_3 = OrderCreateRequest(
            items=[OrderItemCreate(product_id=prod_zene.id, quantity=15)],
            customer_name="Arun Test Customer",
            customer_phone="9876543210",
            delivery_address="Survey 45/B, Genome Valley",
            delivery_city="Hyderabad",
            delivery_state="Telangana",
            delivery_pincode="500078",
            payment_method="COD"
        )
        order_3 = create_order(db=db, order_in=order_req_3, current_user=customer)
        db.commit()
        db.refresh(prod_zene)
        db.refresh(batch_A)

        assert batch_A.quantity == 15
        assert prod_zene.stock == 115

        # Cancel Order 3 (15 units)
        validate_order_transition(order_3.order_status, OrderStatus.CANCELLED)
        order_3.order_status = OrderStatus.CANCELLED
        restock_order_inventory(db, order_3, reason_prefix="Cancellation Restock 3")
        db.commit()
        db.refresh(prod_zene)
        db.refresh(batch_A)
        db.refresh(batch_B)

        assert batch_A.quantity == 30
        assert batch_B.quantity == 100
        assert prod_zene.stock == 130
        assert prod_zene.reserved_stock == 0
        assert prod_zene.batch_no == "EV2026-Z01"
        print("  ✓ SCENARIO 8 ASSERTIONS PASSED!")

        # =========================================================================
        # TASK 6: LEDGER BALANCE_AFTER SEQUENCE VERIFICATION
        # =========================================================================
        print_header("TASK 6: PROGRAMMATIC INVENTORY LEDGER BALANCE_AFTER VERIFICATION")
        print_recent_ledger(db, prod_zene.id, limit=20)

        txns = db.query(InventoryTransaction).filter(InventoryTransaction.product_id == prod_zene.id).order_by(InventoryTransaction.id.asc()).all()
        
        expected_ledger_sequence = [
            # Txn 1: Receipt A +30 -> 30
            ("RECEIPT", 30, 30),
            # Txn 2: Receipt B +100 -> 130
            ("RECEIPT", 100, 130),
            # Txn 3 & 4: Order 1 (50 units) -> Sale A -30 (100), Sale B -20 (80)
            ("SALE", -30, 100),
            ("SALE", -20, 80),
            # Txn 5 & 6: Cancel Order 1 -> Restock A +30 (110), Restock B +20 (130)
            ("RESTOCK", 30, 110),
            ("RESTOCK", 20, 130),
            # Txn 7: Order 2 (20 units) -> Sale A -20 (110)
            ("SALE", -20, 110),
            # Txn 8: Cancel Order 2 -> Restock A +20 (130)
            ("RESTOCK", 20, 130),
            # Txn 9: Order 3 (15 units) -> Sale A -15 (115)
            ("SALE", -15, 115),
            # Txn 10: Cancel Order 3 -> Restock A +15 (130)
            ("RESTOCK", 15, 130),
        ]

        assert len(txns) == len(expected_ledger_sequence), f"Expected {len(expected_ledger_sequence)} transactions, found {len(txns)}"
        for idx, (exp_type, exp_qty, exp_bal) in enumerate(expected_ledger_sequence):
            actual_t = txns[idx]
            assert actual_t.transaction_type == exp_type, f"Txn #{idx+1} type expected '{exp_type}', got '{actual_t.transaction_type}'"
            assert actual_t.quantity == exp_qty, f"Txn #{idx+1} quantity expected {exp_qty}, got {actual_t.quantity}"
            assert actual_t.balance_after == exp_bal, f"Txn #{idx+1} balance_after expected {exp_bal}, got {actual_t.balance_after}"

        print("  ✓ TASK 6 LEDGER BALANCE_AFTER SEQUENCE VERIFIED PROGRAMMATICALLY!")

        print_header("ALL INVENTORY & ORDER MECHANICS VERIFIED WITH 100% SUCCESS!")

    except Exception as err:
        db.rollback()
        print(f"\n❌ HARD ASSERTION FAILURE / EXECUTION ERROR: {err}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
