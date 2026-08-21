"""
Release Gate: Security — JWT, RBAC, IDOR, BOLA
Critical security controls that must pass before every release.
"""
import sys
import os
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
TEST_DB_PATH = BACKEND_DIR / "pharmalink_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from fastapi.testclient import TestClient
from jose import jwt
from app.main import app
from app.core.config import settings
from app.core.security import create_access_token
from app.core.database import SessionLocal, sync_db_schema
from app.core.rate_limiter import login_rate_limiter
from app.seeds.seed_data import seed_database

sync_db_schema()
seed_database()

client = TestClient(app)


class TestReleaseSecurity(unittest.TestCase):
    """Gate [2–5]: Authentication, JWT security, RBAC, IDOR protection."""

    def setUp(self):
        login_rate_limiter._attempts.clear()

    # ── JWT ──────────────────────────────────────────────────────────────────

    def test_01_valid_admin_login(self):
        res = client.post("/api/v1/auth/login", json={
            "email": "admin@pharmalink.com", "password": "Admin@123"
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn("access_token", res.json())

    def test_02_wrong_password_rejected(self):
        res = client.post("/api/v1/auth/login", json={
            "email": "admin@pharmalink.com", "password": "WrongPassword!"
        })
        self.assertEqual(res.status_code, 401)

    def test_03_expired_jwt_rejected(self):
        token = create_access_token("1", "ADMIN", expires_delta=timedelta(minutes=-10))
        res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 401)

    def test_04_invalid_signature_rejected(self):
        bad_token = jwt.encode(
            {"sub": "1", "role": "ADMIN", "exp": datetime.now(timezone.utc) + timedelta(minutes=15)},
            "attacker-secret", algorithm="HS256"
        )
        res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {bad_token}"})
        self.assertEqual(res.status_code, 401)

    def test_05_malformed_jwt_rejected(self):
        res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer garbage.token.here"})
        self.assertEqual(res.status_code, 401)

    def test_06_missing_jwt_rejected(self):
        res = client.get("/api/v1/auth/me")
        self.assertEqual(res.status_code, 401)

    # ── RBAC ─────────────────────────────────────────────────────────────────

    def test_07_customer_cannot_access_admin_orders(self):
        token = client.post("/api/v1/auth/login", json={
            "email": "customer@gmail.com", "password": "Cust@123"
        }).json()["access_token"]
        res = client.get("/api/v1/orders/admin/all",
                         headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 403)

    def test_08_distributor_cannot_access_user_list(self):
        token = client.post("/api/v1/auth/login", json={
            "email": "distributor@medplus.com", "password": "Dist@123"
        }).json()["access_token"]
        res = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 403)

    def test_09_admin_can_access_dashboard(self):
        token = client.post("/api/v1/auth/login", json={
            "email": "admin@pharmalink.com", "password": "Admin@123"
        }).json()["access_token"]
        res = client.get("/api/v1/reports/dashboard",
                         headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)

    # ── IDOR ─────────────────────────────────────────────────────────────────

    def test_10_idor_customer_cannot_access_other_order(self):
        """Customer A cannot read Customer B's order."""
        # Register customer B and place order
        ts = datetime.now().timestamp()
        cust_b_res = client.post("/api/v1/auth/register-customer", json={
            "email": f"idor_b_{ts}@test.com",
            "password": "IdorB@123",
            "full_name": "IDOR Test B"
        }).json()
        cust_b_headers = {"Authorization": f"Bearer {cust_b_res['access_token']}"}

        order_res = client.post("/api/v1/orders", json={
            "items": [{"product_id": 1, "quantity": 1}],
            "customer_name": "IDOR B",
            "delivery_address": "B Street",
            "delivery_city": "Hyderabad",
            "delivery_state": "Telangana",
            "delivery_pincode": "500001"
        }, headers=cust_b_headers)
        order_id = order_res.json().get("id")
        if not order_id:
            self.skipTest("Order creation failed — check product availability")

        # Customer A tries to access it
        cust_a_token = client.post("/api/v1/auth/login", json={
            "email": "customer@gmail.com", "password": "Cust@123"
        }).json()["access_token"]
        res = client.get(f"/api/v1/orders/{order_id}",
                         headers={"Authorization": f"Bearer {cust_a_token}"})
        self.assertEqual(res.status_code, 403)

    def test_11_rate_limiting_triggers_on_6th_attempt(self):
        """Login rate limiter must block on 6th consecutive failure."""
        ts = datetime.now().timestamp()
        email = f"ratelimit_{ts}@release.com"
        for _ in range(5):
            client.post("/api/v1/auth/login", json={"email": email, "password": "wrong"})
        res = client.post("/api/v1/auth/login", json={"email": email, "password": "wrong"})
        self.assertEqual(res.status_code, 429)


if __name__ == "__main__":
    unittest.main()
