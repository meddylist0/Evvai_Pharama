"""
Release Gate: Order Workflow, State Machine & Stock Integrity
"""
import sys
import os
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
from app.models.product import Product
from app.seeds.seed_data import seed_database

sync_db_schema()
seed_database()

client = TestClient(app)


class TestReleaseOrders(unittest.TestCase):
    """Gate [8–10]: Order workflow, stock reservation, state machine."""

    def setUp(self):
        login_rate_limiter._attempts.clear()

    def _admin_token(self):
        return client.post("/api/v1/auth/login", json={
            "email": "admin@pharmalink.com", "password": "Admin@123"
        }).json()["access_token"]

    def _customer_token(self):
        return client.post("/api/v1/auth/login", json={
            "email": "customer@gmail.com", "password": "Cust@123"
        }).json()["access_token"]

    def _create_order(self, token):
        return client.post("/api/v1/orders", json={
            "items": [{"product_id": 1, "quantity": 1}],
            "customer_name": "Release Test Customer",
            "delivery_address": "Test Street",
            "delivery_city": "Hyderabad",
            "delivery_state": "Telangana",
            "delivery_pincode": "500001",
            "payment_method": "UPI/Card"
        }, headers={"Authorization": f"Bearer {token}"})

    def test_01_customer_can_place_order(self):
        token = self._customer_token()
        res = self._create_order(token)
        self.assertEqual(res.status_code, 201)
        self.assertIn("id", res.json())

    def test_02_order_deducts_stock(self):
        token = self._customer_token()

        db = SessionLocal()
        try:
            product = db.query(Product).filter(Product.id == 1).first()
            stock_before = product.stock
        finally:
            db.close()

        res = self._create_order(token)
        self.assertEqual(res.status_code, 201)

        db = SessionLocal()
        try:
            product = db.query(Product).filter(Product.id == 1).first()
            self.assertEqual(product.stock, stock_before - 1, "Stock not decremented on order")
        finally:
            db.close()

    def test_03_order_cancellation_restores_stock(self):
        token = self._customer_token()

        res = self._create_order(token)
        self.assertEqual(res.status_code, 201)
        order_id = res.json()["id"]

        db = SessionLocal()
        try:
            product = db.query(Product).filter(Product.id == 1).first()
            stock_after_order = product.stock
        finally:
            db.close()

        cancel_res = client.post(
            f"/api/v1/orders/{order_id}/cancel",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(cancel_res.status_code, 200)

        db = SessionLocal()
        try:
            product = db.query(Product).filter(Product.id == 1).first()
            self.assertEqual(product.stock, stock_after_order + 1, "Stock not restored on cancel")
        finally:
            db.close()

    def test_04_double_cancellation_rejected(self):
        token = self._customer_token()
        res = self._create_order(token)
        order_id = res.json()["id"]
        client.post(f"/api/v1/orders/{order_id}/cancel",
                    headers={"Authorization": f"Bearer {token}"})
        res2 = client.post(f"/api/v1/orders/{order_id}/cancel",
                           headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res2.status_code, 400)
        self.assertIn("Invalid order status transition", res2.json()["detail"])

    def test_05_valid_state_transitions(self):
        """PENDING -> CONFIRMED -> PACKED -> SHIPPED -> DELIVERED must all succeed."""
        cust_token = self._customer_token()
        admin_token = self._admin_token()
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        res = self._create_order(cust_token)
        self.assertEqual(res.status_code, 201)
        order_id = res.json()["id"]
        current = res.json()["order_status"]

        if current == "Pending":
            r = client.patch(f"/api/v1/orders/{order_id}/status",
                             json={"order_status": "Confirmed"},
                             headers=admin_headers)
            self.assertEqual(r.status_code, 200)

        for status in ["Packed", "Shipped", "Delivered"]:
            r = client.patch(f"/api/v1/orders/{order_id}/status",
                             json={"order_status": status},
                             headers=admin_headers)
            self.assertEqual(r.status_code, 200, f"Transition to {status} failed")

    def test_06_invalid_transition_rejected(self):
        """DELIVERED -> PENDING must be rejected."""
        from app.models.order import Order, OrderStatus
        admin_token = self._admin_token()
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        db = SessionLocal()
        try:
            order = db.query(Order).filter(Order.order_status == OrderStatus.DELIVERED).first()
            if not order:
                self.skipTest("No DELIVERED order available")
            order_id = order.id
        finally:
            db.close()

        res = client.patch(f"/api/v1/orders/{order_id}/status",
                           json={"order_status": "Pending"},
                           headers=admin_headers)
        self.assertEqual(res.status_code, 400)

    def test_07_customer_can_view_own_orders(self):
        token = self._customer_token()
        res = client.get("/api/v1/orders/my-orders",
                         headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)


if __name__ == "__main__":
    unittest.main()
