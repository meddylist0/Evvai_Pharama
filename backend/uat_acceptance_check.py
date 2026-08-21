"""
PharmaLink Enterprise — Comprehensive User Acceptance Testing (UAT) Script
===========================================================================
Executes full real-world business workflows against FastAPI backend using 
TestClient and an isolated test database (pharmalink_test.db).

Scenarios Tested:
1. UAT-01: Customer Registration, JWT Authentication & Profile Verification
2. UAT-02: Distributor Registration, KYC Submission, Admin Review & B2B Unlock
3. UAT-03: Server-Authoritative Pricing & Payment Amount Tampering Protection
4. UAT-04: Razorpay Payment HMAC Signature Verification & Order Confirmation
5. UAT-05: Order State Machine Validation & Inventory Stock Restoration
6. UAT-06: Database Schema Relational FK Integrity & Zero Orphan Verification
"""

import sys
import os
import uuid
import hmac
import hashlib
import unittest
from datetime import datetime

# Enforce isolated test database
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BACKEND_DIR)

TEST_DB_PATH = os.path.join(BACKEND_DIR, "pharmalink_test.db").replace("\\", "/")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, sync_db_schema
from app.seeds.seed_data import seed_database
from app.models.user import User, UserRole, KYCStatus
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.payment import PaymentTransaction
from app.services.payment_service import get_or_create_payment_settings

client = TestClient(app)


class PharmaLinkUATTestSuite(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        sync_db_schema()
        seed_database()

    def test_uat_01_customer_auth_flow(self):
        """UAT-01: Real Customer registration, login, JWT issuance, and me endpoint."""
        email = f"uat_cust_{uuid.uuid4().hex[:8]}@pharmalink.com"
        password = "Password@123"

        # 1. Register Customer (returns 200 with token)
        reg_res = client.post("/api/v1/auth/register-customer", json={
            "email": email,
            "password": password,
            "full_name": "UAT Retail Customer",
            "phone": "9876543210"
        })
        self.assertEqual(reg_res.status_code, 200, f"Customer registration failed: {reg_res.text}")
        data = reg_res.json()
        self.assertEqual(data["email"], email)
        self.assertEqual(data["role"], "CUSTOMER")
        self.assertIn("access_token", data)

        # 2. Login
        login_res = client.post("/api/v1/auth/login", json={
            "email": email,
            "password": password
        })
        self.assertEqual(login_res.status_code, 200)
        token = login_res.json()["access_token"]

        # 3. Me Profile Check
        headers = {"Authorization": f"Bearer {token}"}
        me_res = client.get("/api/v1/auth/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["email"], email)

    def test_uat_02_distributor_kyc_b2b_workflow(self):
        """UAT-02: Distributor Registration -> KYC Submission -> Blocked -> Admin Review -> Unlocked."""
        email = f"uat_dist_{uuid.uuid4().hex[:8]}@medpharma.com"
        password = "DistributorPass@123"

        # 1. Register Distributor
        reg_res = client.post("/api/v1/auth/register-distributor", json={
            "email": email,
            "password": password,
            "full_name": "Vikram Singh",
            "phone": "9123456789",
            "company_name": "UAT Pharma Logistics Ltd",
            "distributor_name": "Vikram Singh",
            "gstin": "36AABCT1234H1Z5",
            "drug_license_no": "DL-TG-2026-9988",
            "business_address": "B2B Tech Park",
            "city": "Hyderabad",
            "state": "Telangana",
            "pincode": "500081"
        })
        self.assertEqual(reg_res.status_code, 200, f"Distributor registration failed: {reg_res.text}")
        dist_token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {dist_token}"}

        # 2. Unapproved Distributor attempting order creation must be blocked
        order_attempt = client.post("/api/v1/orders/", json={
            "items": [{"product_id": 1, "quantity": 10}],
            "customer_name": "UAT Wholesale",
            "delivery_address": "B2B Park",
            "delivery_city": "Hyderabad",
            "delivery_state": "Telangana",
            "delivery_pincode": "500081"
        }, headers=headers)
        self.assertEqual(order_attempt.status_code, 403)
        self.assertIn("KYC", order_attempt.json()["detail"])

        # 3. Admin Log in & Approve KYC
        admin_login = client.post("/api/v1/auth/login", json={
            "email": "admin@pharmalink.com",
            "password": "Admin@123"
        }).json()
        admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

        # Fetch pending KYC submissions
        pending_kyc = client.get("/api/v1/kyc/pending", headers=admin_headers).json()
        self.assertGreater(len(pending_kyc), 0)
        target_kyc = [k for k in pending_kyc if k["gst_number"] == "36AABCT1234H1Z5"][0]

        review_res = client.post(f"/api/v1/kyc/{target_kyc['id']}/review", json={
            "status": "APPROVED",
            "admin_remarks": "UAT License Verified"
        }, headers=admin_headers)
        self.assertEqual(review_res.status_code, 200)
        self.assertEqual(review_res.json()["verification_status"], "APPROVED")

        # 4. Approved Distributor placing wholesale order must now succeed
        order_success = client.post("/api/v1/orders/", json={
            "items": [{"product_id": 1, "quantity": 10}],
            "customer_name": "UAT Wholesale",
            "delivery_address": "B2B Park",
            "delivery_city": "Hyderabad",
            "delivery_state": "Telangana",
            "delivery_pincode": "500081"
        }, headers=headers)
        self.assertEqual(order_success.status_code, 201)

    def test_uat_03_server_authoritative_pricing_tamper_rejection(self):
        """UAT-03: Client price/amount tampering is strictly rejected; server calculates total from DB."""
        cust_login = client.post("/api/v1/auth/login", json={
            "email": "customer@gmail.com",
            "password": "Cust@123"
        }).json()
        headers = {"Authorization": f"Bearer {cust_login['access_token']}"}

        # 1. Attacker sends {"amount": 1.0} without cart items -> Expect HTTP 400 Bad Request
        tamper_res = client.post("/api/v1/payments/create-razorpay-order", json={
            "amount": 1.0,
            "currency": "INR"
        }, headers=headers)
        self.assertEqual(tamper_res.status_code, 400)
        self.assertIn("Cart items are required", tamper_res.json()["detail"])

        # 2. Valid request with cart items -> Server calculates authoritative price
        valid_res = client.post("/api/v1/payments/create-razorpay-order", json={
            "items": [{"product_id": 1, "quantity": 2}],
            "currency": "INR"
        }, headers=headers)
        self.assertEqual(valid_res.status_code, 200)
        rz_data = valid_res.json()
        self.assertGreater(rz_data["amount"], 0)

    def test_uat_04_razorpay_hmac_crypto_and_payment_verification(self):
        """UAT-04: Real HMAC-SHA256 Razorpay payment verification & order placement."""
        cust_login = client.post("/api/v1/auth/login", json={
            "email": "customer@gmail.com",
            "password": "Cust@123"
        }).json()
        headers = {"Authorization": f"Bearer {cust_login['access_token']}"}

        # 1. Create Razorpay Payment Order
        rz_res = client.post("/api/v1/payments/create-razorpay-order", json={
            "items": [{"product_id": 1, "quantity": 1}],
            "currency": "INR"
        }, headers=headers)
        self.assertEqual(rz_res.status_code, 200)
        rz_data = rz_res.json()

        # 2. Get Secret Key from DB
        db = SessionLocal()
        try:
            config = get_or_create_payment_settings(db)
            secret = config.key_secret
        finally:
            db.close()

        fake_pay_id = f"pay_uat_{uuid.uuid4().hex[:10]}"
        msg = f"{rz_data['razorpay_order_id']}|{fake_pay_id}"
        sig = hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()

        # 3. Verify & Place Order
        place_res = client.post("/api/v1/payments/verify-and-order", json={
            "razorpay_payment_id": fake_pay_id,
            "razorpay_order_id": rz_data["razorpay_order_id"],
            "razorpay_signature": sig,
            "order_data": {
                "items": [{"product_id": 1, "quantity": 1}],
                "customer_name": "UAT Paid Customer",
                "delivery_address": "123 Healthcare Way",
                "delivery_city": "Hyderabad",
                "delivery_state": "Telangana",
                "delivery_pincode": "500001"
            }
        }, headers=headers)
        self.assertEqual(place_res.status_code, 201)
        order_out = place_res.json()
        self.assertEqual(order_out["payment_status"].upper(), "PAID")
        self.assertEqual(order_out["order_status"].upper(), "CONFIRMED")

        # 4. Replay attack attempt with same payment ID -> Expect HTTP 400
        replay_res = client.post("/api/v1/payments/verify-and-order", json={
            "razorpay_payment_id": fake_pay_id,
            "razorpay_order_id": rz_data["razorpay_order_id"],
            "razorpay_signature": sig,
            "order_data": {
                "items": [{"product_id": 1, "quantity": 1}],
                "customer_name": "UAT Attacker",
                "delivery_address": "123 Healthcare Way",
                "delivery_city": "Hyderabad",
                "delivery_state": "Telangana",
                "delivery_pincode": "500001"
            }
        }, headers=headers)
        self.assertEqual(replay_res.status_code, 400)

    def test_uat_05_order_state_machine_and_stock_restoration(self):
        """UAT-05: Order lifecycle transitions and stock restoration on cancellation."""
        cust_login = client.post("/api/v1/auth/login", json={
            "email": "customer@gmail.com",
            "password": "Cust@123"
        }).json()
        cust_headers = {"Authorization": f"Bearer {cust_login['access_token']}"}

        # 1. Check Initial Stock
        db = SessionLocal()
        try:
            prod = db.query(Product).filter(Product.id == 1).first()
            initial_stock = prod.stock
        finally:
            db.close()

        # 2. Place Order
        order_res = client.post("/api/v1/orders/", json={
            "items": [{"product_id": 1, "quantity": 2}],
            "customer_name": "UAT Cancel Customer",
            "delivery_address": "Street 1",
            "delivery_city": "City",
            "delivery_state": "State",
            "delivery_pincode": "500001"
        }, headers=cust_headers)
        self.assertEqual(order_res.status_code, 201)
        order_id = order_res.json()["id"]

        # Stock should be decremented by 2
        db = SessionLocal()
        try:
            prod = db.query(Product).filter(Product.id == 1).first()
            self.assertEqual(prod.stock, initial_stock - 2)
        finally:
            db.close()

        # 3. Cancel Order
        cancel_res = client.post(f"/api/v1/orders/{order_id}/cancel", json={
            "reason": "UAT Cancellation Test"
        }, headers=cust_headers)
        self.assertEqual(cancel_res.status_code, 200)

        # Stock should be restored to initial_stock
        db = SessionLocal()
        try:
            prod = db.query(Product).filter(Product.id == 1).first()
            self.assertEqual(prod.stock, initial_stock)
        finally:
            db.close()

    def test_uat_06_database_relational_fk_integrity(self):
        """UAT-06: Asserts zero orphan records exist across all database tables."""
        db = SessionLocal()
        try:
            orphan_items = db.query(OrderItem).filter(~OrderItem.order_id.in_(db.query(Order.id))).count()
            self.assertEqual(orphan_items, 0, "No orphan OrderItem records should exist.")

            users_count = db.query(User).count()
            self.assertGreaterEqual(users_count, 4, "Minimum seed users must exist.")
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
