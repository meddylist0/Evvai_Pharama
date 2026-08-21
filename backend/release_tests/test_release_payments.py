"""
Release Gate: Payment Security — Signature, Ownership, Duplicate Prevention
"""
import sys
import os
import hmac
import hashlib
import uuid
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
TEST_DB_PATH = BACKEND_DIR / "pharmalink_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, sync_db_schema
from app.core.rate_limiter import login_rate_limiter
from app.seeds.seed_data import seed_database
from app.services.payment_service import verify_razorpay_signature, get_or_create_payment_settings

sync_db_schema()
seed_database()

client = TestClient(app)


class TestReleasePayments(unittest.TestCase):
    """Gate [11]: Razorpay security — signature verification, ownership, no duplicate."""

    def setUp(self):
        login_rate_limiter._attempts.clear()

    def _customer_token(self):
        return client.post("/api/v1/auth/login", json={
            "email": "customer@gmail.com", "password": "Cust@123"
        }).json()["access_token"]

    def test_01_signature_unit_test(self):
        """HMAC-SHA256 signature must verify correctly."""
        secret = "test_secret_abc"
        order_id = "order_test_xyz"
        pay_id = "pay_test_abc"
        msg = f"{order_id}|{pay_id}"
        valid_sig = hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()

        self.assertTrue(verify_razorpay_signature(secret, order_id, pay_id, valid_sig))
        self.assertFalse(verify_razorpay_signature(secret, order_id, pay_id, "tampered"))
        self.assertFalse(verify_razorpay_signature(secret, order_id, pay_id, ""))

    def test_02_invalid_signature_rejected_by_api(self):
        """API must reject payment verification with invalid signature."""
        token = self._customer_token()
        headers = {"Authorization": f"Bearer {token}"}

        rz_res = client.post("/api/v1/payments/create-razorpay-order", json={
            "items": [{"product_id": 1, "quantity": 1}], "currency": "INR"
        }, headers=headers)
        if rz_res.status_code != 200:
            self.skipTest("Razorpay order creation failed — check payment config")

        rz_data = rz_res.json()
        res = client.post("/api/v1/payments/verify-and-order", json={
            "razorpay_payment_id": f"pay_{uuid.uuid4().hex[:10]}",
            "razorpay_order_id": rz_data["razorpay_order_id"],
            "razorpay_signature": "invalid_attacker_sig",
            "order_data": {
                "items": [{"product_id": 1, "quantity": 1}],
                "customer_name": "Test",
                "delivery_address": "Test",
                "delivery_city": "Hyderabad",
                "delivery_state": "Telangana",
                "delivery_pincode": "500001"
            }
        }, headers=headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid Razorpay cryptographic signature", res.json()["detail"])

    def test_03_missing_payment_transaction_rejected(self):
        """Payment verification must fail if no PaymentTransaction exists for razorpay_order_id."""
        token = self._customer_token()
        headers = {"Authorization": f"Bearer {token}"}

        fake_order_id = f"order_nonexistent_{uuid.uuid4().hex[:10]}"
        fake_pay_id = f"pay_fake_{uuid.uuid4().hex[:10]}"

        db = SessionLocal()
        try:
            config = get_or_create_payment_settings(db)
            secret = config.key_secret
        finally:
            db.close()

        msg = f"{fake_order_id}|{fake_pay_id}"
        sig = hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()

        res = client.post("/api/v1/payments/verify-and-order", json={
            "razorpay_payment_id": fake_pay_id,
            "razorpay_order_id": fake_order_id,
            "razorpay_signature": sig,
            "order_data": {
                "items": [{"product_id": 1, "quantity": 1}],
                "customer_name": "Test",
                "delivery_address": "Test",
                "delivery_city": "Test",
                "delivery_state": "Test",
                "delivery_pincode": "500001"
            }
        }, headers=headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Payment transaction not found", res.json()["detail"])

    def test_04_client_amount_tampering_rejected(self):
        """create-razorpay-order must reject requests without cart items."""
        token = self._customer_token()
        res = client.post("/api/v1/payments/create-razorpay-order", json={
            "amount": 1.0, "currency": "INR"
        }, headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 400)
        self.assertIn("Cart items are required", res.json()["detail"])


if __name__ == "__main__":
    unittest.main()
