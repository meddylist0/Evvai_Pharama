"""
Release Gate: API Health Check
Verifies the core API is reachable and returns expected status codes.
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
from app.seeds.seed_data import seed_database

sync_db_schema()
seed_database()

client = TestClient(app)


class TestReleaseHealth(unittest.TestCase):
    """Gate [1]: API Health — core endpoints must return expected status codes."""

    def test_01_api_root_reachable(self):
        """API root or docs endpoint must be reachable (200 or 404 — not 500)."""
        res = client.get("/")
        self.assertNotEqual(res.status_code, 500, "API root returned 500 — server error")

    def test_02_products_public_list(self):
        """Public product listing endpoint must return 200."""
        res = client.get("/api/v1/products")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    def test_03_categories_public_list(self):
        """Categories endpoint must return 200."""
        res = client.get("/api/v1/categories")
        self.assertEqual(res.status_code, 200)

    def test_04_protected_endpoint_without_token_returns_401(self):
        """Protected endpoint must reject unauthenticated requests with 401."""
        res = client.get("/api/v1/auth/me")
        self.assertEqual(res.status_code, 401)

    def test_05_admin_login_works(self):
        """Admin login must succeed and return a valid token."""
        res = client.post("/api/v1/auth/login", json={
            "email": "admin@pharmalink.com",
            "password": "Admin@123"
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn("access_token", res.json())

    def test_06_reports_dashboard_accessible_by_admin(self):
        """Admin dashboard endpoint must return 200 for authenticated admin."""
        token = client.post("/api/v1/auth/login", json={
            "email": "admin@pharmalink.com", "password": "Admin@123"
        }).json()["access_token"]
        res = client.get("/api/v1/reports/dashboard",
                         headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)

    def test_07_server_error_free_on_all_core_routes(self):
        """None of the core read endpoints should return 500."""
        public_routes = [
            "/api/v1/products",
            "/api/v1/categories",
        ]
        for route in public_routes:
            res = client.get(route)
            self.assertNotEqual(
                res.status_code, 500,
                f"Route {route} returned 500: {res.text}"
            )


if __name__ == "__main__":
    unittest.main()
