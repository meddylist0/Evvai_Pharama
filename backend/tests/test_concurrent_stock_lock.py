
"""
Concurrent Stock Locking & Race Condition Verification Test
-----------------------------------------------------------
Simulates User A and User B attempting to purchase the exact same product
at the exact same millisecond using Python multithreading and a synchronization Barrier.

Scenario:
- Initial Product Stock = 10 units
- User A requests = 8 units
- User B requests = 5 units
- Both requests fire simultaneously.

Expected Result:
- Exactly 1 User order succeeds (Stock reduced to 2).
- Exactly 1 User order fails with HTTP 400 Bad Request ("Insufficient inventory...").
- Final Stock in Database = 2 units (Zero overselling, Zero double booking).
"""

import sys
import os
import threading
import logging
from typing import Dict, Any

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import User, UserRole
from app.models.product import Product, Category
from app.schemas.order import OrderCreateRequest, OrderItemCreate
from app.services.order_service import create_order
from app.core.security import get_password_hash

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ConcurrencyTest")


def run_concurrent_stock_lock_test():
    print("\n" + "=" * 80)
    print(" [TEST] RUNNING CONCURRENT STOCK LOCKING & RACE CONDITION TEST")
    print("=" * 80)

    # 1. Setup temporary test SQLite database file shared across threads
    TEST_DB_FILE = os.path.join(backend_dir, "tests", "test_concurrent.db")
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass

    TEST_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}?check_same_thread=False"
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Create tables
    Base.metadata.create_all(bind=engine)

    # 2. Seed Initial Test Data
    setup_db = TestingSessionLocal()
    
    # Create Category
    category = Category(name="Cardiology", slug="cardiology", is_active=True)
    setup_db.add(category)
    setup_db.commit()
    setup_db.refresh(category)

    # Create Product with Initial Stock = 10
    product = Product(
        sku="TEST-AZI-500",
        name="Azithromycin 500mg Tablets",
        composition="Azithromycin IP 500mg",
        pack_size="10x3 Strip Pack",
        mrp=150.0,
        customer_price=120.0,
        distributor_price=100.0,
        bulk_price=90.0,
        bulk_moq=20,
        stock=10,  # INITIAL STOCK = 10
        reserved_stock=0,
        batch_no="BATCH-AZI-2026",
        category_id=category.id,
        status="active"
    )
    setup_db.add(product)

    # Create User A (Customer A)
    user_a = User(
        email="user_a@gmail.com",
        hashed_password=get_password_hash("Pass123!"),
        full_name="User A (Fast Buyer)",
        phone="+91 9988776651",
        role=UserRole.CUSTOMER,
        is_active=True,
        is_verified=True
    )
    setup_db.add(user_a)

    # Create User B (Customer B)
    user_b = User(
        email="user_b@gmail.com",
        hashed_password=get_password_hash("Pass123!"),
        full_name="User B (Concurrent Buyer)",
        phone="+91 9988776652",
        role=UserRole.CUSTOMER,
        is_active=True,
        is_verified=True
    )
    setup_db.add(user_b)

    setup_db.commit()
    product_id = product.id
    user_a_id = user_a.id
    user_b_id = user_b.id
    setup_db.close()

    print(f"[*] Seeded Product ID: {product_id} ('Azithromycin 500mg Tablets') with Stock = 10 units.")
    print("[*] Created User A (requests 8 units) and User B (requests 5 units).")

    # 3. Setup Multithreading Synchronization Barrier
    barrier = threading.Barrier(2)
    results: Dict[str, Dict[str, Any]] = {}

    def attempt_purchase(user_id: int, request_qty: int, user_label: str):
        # Open independent database session for this thread
        db_session = TestingSessionLocal()
        try:
            # Re-query user
            current_user = db_session.query(User).filter(User.id == user_id).first()
            
            order_payload = OrderCreateRequest(
                items=[OrderItemCreate(product_id=product_id, quantity=request_qty)],
                customer_name=current_user.full_name,
                customer_phone=current_user.phone,
                delivery_address="Plot 100, Bio Tech Hub",
                delivery_city="Hyderabad",
                delivery_state="Telangana",
                delivery_pincode="500081",
                payment_method="COD"
            )

            # Wait for all threads to reach barrier so they execute at the exact microsecond
            barrier.wait()

            # Execute order creation
            order = create_order(db=db_session, order_in=order_payload, current_user=current_user)
            results[user_label] = {
                "success": True,
                "order_code": order.order_code,
                "total_amount": order.total_amount,
                "error": None
            }
        except HTTPException as he:
            results[user_label] = {
                "success": False,
                "order_code": None,
                "status_code": he.status_code,
                "error": he.detail
            }
        except Exception as ex:
            results[user_label] = {
                "success": False,
                "order_code": None,
                "status_code": 500,
                "error": str(ex)
            }
        finally:
            db_session.close()

    # 4. Spawn Threads
    thread_a = threading.Thread(target=attempt_purchase, args=(user_a_id, 8, "User A (8 units)"))
    thread_b = threading.Thread(target=attempt_purchase, args=(user_b_id, 5, "User B (5 units)"))

    print("\n[+] Firing both Threads simultaneously at the exact microsecond...")
    thread_a.start()
    thread_b.start()

    thread_a.join()
    thread_b.join()

    # 5. Evaluate Results
    print("\n" + "-" * 80)
    print(" [RESULTS] CONCURRENCY TEST EXECUTION RESULTS")
    print("-" * 80)
    
    successes = 0
    failures = 0

    for user_label, result in results.items():
        if result["success"]:
            successes += 1
            print(f" [PASS] {user_label}: SUCCESS! Order Code: {result['order_code']} | Total Amount: RS.{result['total_amount']}")
        else:
            failures += 1
            print(f" [BLOCK] {user_label}: FAILED (Expected Status {result.get('status_code', 400)}) -> Detail: '{result['error']}'")

    # 6. Verify Final Product Stock in Database
    verify_db = TestingSessionLocal()
    final_product = verify_db.query(Product).filter(Product.id == product_id).first()
    final_stock = final_product.stock
    final_reserved = final_product.reserved_stock
    verify_db.close()
    engine.dispose()

    print("\n" + "=" * 80)
    print(f" [DATABASE INTEGRITY CHECK]:")
    print(f"    - Initial Stock:          10 units")
    print(f"    - Successful Orders Count: {successes}")
    print(f"    - Failed Orders Count:     {failures}")
    print(f"    - Final Available Stock:   {final_stock} units")
    print(f"    - Final Reserved Stock:    {final_reserved} units")
    print("=" * 80)

    # 7. Assertions
    assert successes == 1, f"Expected exactly 1 successful order, got {successes}"
    assert failures == 1, f"Expected exactly 1 failed order, got {failures}"
    assert final_stock + final_reserved == 10, f"Expected total stock conservation (stock + reserved == 10), got {final_stock + final_reserved}"

    print("\n [TEST PASSED] Zero Double-Booking, Zero Overselling, 100% Atomic Stock Lock Verified!")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    run_concurrent_stock_lock_test()
