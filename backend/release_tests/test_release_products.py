"""
Release Gate: Products CRUD & Role-Based Pricing
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
from app.core.database import sync_db_schema
from app.core.rate_limiter import login_rate_limiter
from app.seeds.seed_data import seed_database

sync_db_schema()
seed_database()

client = TestClient(app)


class TestReleaseProducts(unittest.TestCase):
    """Gate [6–7]: Product CRUD, role-based pricing, soft/hard delete integrity."""

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

    def _distributor_token(self):
        return client.post("/api/v1/auth/login", json={
            "email": "distributor@medplus.com", "password": "Dist@123"
        }).json()["access_token"]

    def test_01_product_list_returns_200(self):
        res = client.get("/api/v1/products")
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()), 0)

    def test_02_customer_does_not_see_distributor_price(self):
        """Customers must not see distributor_price or bulk_price fields."""
        token = self._customer_token()
        res = client.get("/api/v1/products", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        for product in res.json():
            self.assertIsNone(
                product.get("distributor_price"),
                f"Product {product['name']} leaks distributor_price to customer"
            )

    def test_03_distributor_sees_distributor_price(self):
        """Approved distributors must see distributor_price."""
        token = self._distributor_token()
        res = client.get("/api/v1/products", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        for product in res.json():
            self.assertIsNotNone(
                product.get("distributor_price"),
                f"Product {product['name']} missing distributor_price for distributor"
            )

    def test_04_admin_can_create_product(self):
        """Admin can create a new product."""
        token = self._admin_token()
        res = client.post("/api/v1/products", json={
            "sku": "REL-TEST-999",
            "name": "Release Test Product",
            "subtitle": "Test subtitle",
            "composition": "Test Composition 10mg",
            "pack_size": "10 Tablets",
            "category_id": 1,
            "description": "Release test product",
            "mrp": 100.0,
            "customer_price": 90.0,
            "distributor_price": 70.0,
            "bulk_price": 60.0,
            "bulk_moq": 50,
            "stock": 1000,
            "low_stock_threshold": 100,
            "batch_no": "REL-2026-001",
            "expiry_date": "12/2028",
            "status": "active"
        }, headers={"Authorization": f"Bearer {token}"})
        self.assertIn(res.status_code, [200, 201])
        data = res.json()
        self.assertIn("id", data)
        # Cleanup: soft delete
        client.delete(f"/api/v1/products/{data['id']}",
                      headers={"Authorization": f"Bearer {token}"})

    def test_05_customer_cannot_create_product(self):
        """Customers must not be able to create products (403)."""
        token = self._customer_token()
        res = client.post("/api/v1/products", json={
            "sku": "CUST-HACK-001",
            "name": "Hack Product",
            "composition": "X 10mg",
            "pack_size": "1 Tablet",
            "mrp": 10.0,
            "customer_price": 9.0,
            "distributor_price": 7.0,
            "bulk_price": 6.0,
            "bulk_moq": 50,
            "stock": 100,
            "low_stock_threshold": 10,
        }, headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 403)

    def test_06_soft_delete_disables_product(self):
        """Soft delete sets product status to disabled, does not remove from DB."""
        token = self._admin_token()
        # Create a temp product to soft-delete
        create_res = client.post("/api/v1/products", json={
            "sku": "SOFT-DEL-001",
            "name": "Soft Delete Test",
            "subtitle": "",
            "composition": "X 10mg",
            "pack_size": "1 Tablet",
            "category_id": 1,
            "mrp": 10.0,
            "customer_price": 9.0,
            "distributor_price": 7.0,
            "bulk_price": 6.0,
            "bulk_moq": 50,
            "stock": 100,
            "low_stock_threshold": 10,
            "status": "active"
        }, headers={"Authorization": f"Bearer {token}"})
        product_id = create_res.json().get("id")
        if not product_id:
            self.skipTest("Product creation failed")

        del_res = client.delete(f"/api/v1/products/{product_id}",
                                headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(del_res.status_code, 200)
        self.assertIn("disabled", del_res.json()["message"])

        # Should not appear in default (active only) list
        list_res = client.get("/api/v1/products")
        ids = [p["id"] for p in list_res.json()]
        self.assertNotIn(product_id, ids)


if __name__ == "__main__":
    unittest.main()
