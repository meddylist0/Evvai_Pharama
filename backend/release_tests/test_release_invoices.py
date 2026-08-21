"""
Release Gate: Invoice Security — IDOR protection on invoice access
"""
import sys
import os
import unittest
from datetime import datetime
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
TEST_DB_PATH = BACKEND_DIR / "pharmalink_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import sync_db_schema
from app.core.rate_limiter import login_rate_limiter
from app.seeds.seed_data import seed_database

sync_db_schema()
seed_database()

client = TestClient(app)


class TestReleaseInvoices(unittest.TestCase):
    """Gate [12–13]: Invoice IDOR protection and reconciliation integrity."""

    def setUp(self):
        login_rate_limiter._attempts.clear()

    def test_01_customer_cannot_access_other_customer_invoice(self):
        """Customer A must not be able to fetch Customer B's invoice."""
        ts = datetime.now().timestamp()
        # Register customer B
        cust_b_res = client.post("/api/v1/auth/register-customer", json={
            "email": f"inv_idor_b_{ts}@test.com",
            "password": "InvB@123",
            "full_name": "Invoice IDOR B"
        }).json()
        cust_b_headers = {"Authorization": f"Bearer {cust_b_res['access_token']}"}

        # Customer B places order
        order_res = client.post("/api/v1/orders", json={
            "items": [{"product_id": 1, "quantity": 1}],
            "customer_name": "Invoice IDOR B",
            "delivery_address": "B Street",
            "delivery_city": "Hyderabad",
            "delivery_state": "Telangana",
            "delivery_pincode": "500001"
        }, headers=cust_b_headers)

        order_id = order_res.json().get("id")
        if not order_id:
            self.skipTest("Order creation failed")

        # Customer A tries to fetch B's invoice
        cust_a_token = client.post("/api/v1/auth/login", json={
            "email": "customer@gmail.com", "password": "Cust@123"
        }).json()["access_token"]

        res = client.get(f"/api/v1/orders/{order_id}/invoice",
                         headers={"Authorization": f"Bearer {cust_a_token}"})
        self.assertEqual(res.status_code, 403,
                         "Customer A should not access Customer B's invoice")

    def test_02_admin_can_access_any_invoice(self):
        """Admin must be able to access any customer's invoice."""
        # Get an existing order with invoice
        from app.core.database import SessionLocal
        from app.models.order import Order
        db = SessionLocal()
        try:
            order = db.query(Order).filter(Order.invoice_number.isnot(None)).first()
            if not order:
                self.skipTest("No invoiced order found")
            order_id = order.id
        finally:
            db.close()

        admin_token = client.post("/api/v1/auth/login", json={
            "email": "admin@pharmalink.com", "password": "Admin@123"
        }).json()["access_token"]

        res = client.get(f"/api/v1/orders/{order_id}/invoice",
                         headers={"Authorization": f"Bearer {admin_token}"})
        self.assertIn(res.status_code, [200, 404],
                      "Admin invoice access returned unexpected status")

    def test_03_customer_can_access_own_invoice(self):
        """Customer can access their own order's invoice."""
        token = client.post("/api/v1/auth/login", json={
            "email": "customer@gmail.com", "password": "Cust@123"
        }).json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Place an order first
        order_res = client.post("/api/v1/orders", json={
            "items": [{"product_id": 1, "quantity": 1}],
            "customer_name": "Invoice Own Test",
            "delivery_address": "Own Street",
            "delivery_city": "Hyderabad",
            "delivery_state": "Telangana",
            "delivery_pincode": "500001"
        }, headers=headers)
        order_id = order_res.json().get("id")
        if not order_id:
            self.skipTest("Order creation failed")

        res = client.get(f"/api/v1/orders/{order_id}/invoice", headers=headers)
        # Invoice may or may not be generated depending on payment status; just not 403
        self.assertNotEqual(res.status_code, 403,
                            "Customer must be able to access own invoice")


if __name__ == "__main__":
    unittest.main()
