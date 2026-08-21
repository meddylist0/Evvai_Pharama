import sys
import os
import unittest
from datetime import datetime, timedelta, timezone

# Ensure backend folder is on sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

# Force isolated test database
TEST_DB_PATH = os.path.join(BACKEND_DIR, "pharmalink_test.db").replace("\\", "/")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from fastapi.testclient import TestClient
from jose import jwt

from app.main import app
from app.core.config import settings
from app.core.security import create_access_token
from app.core.permissions import get_current_user_optional
from app.core.rate_limiter import login_rate_limiter
from app.models.user import User
from app.core.database import SessionLocal, sync_db_schema
from app.seeds.seed_data import seed_database
from app.services.audit_service import record_audit

client = TestClient(app)

# Ensure DB schema and seeds are loaded once
sync_db_schema()
seed_database()


class TestSecurityAuth(unittest.TestCase):

    def setUp(self):
        """Reset rate limiter before every test to prevent test_21 poisoning subsequent logins."""
        login_rate_limiter._attempts.clear()

    def test_01_valid_login(self):
        response = client.post("/api/v1/auth/login", json={
            "email": "admin@pharmalink.com",
            "password": "Admin@123"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["role"], "ADMIN")

    def test_02_wrong_password(self):
        response = client.post("/api/v1/auth/login", json={
            "email": "admin@pharmalink.com",
            "password": "WrongPassword123!"
        })
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Incorrect email or password")

    def test_03_unknown_email(self):
        response = client.post("/api/v1/auth/login", json={
            "email": "nonexistent_sec_user@pharmalink.com",
            "password": "Admin@123"
        })
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Incorrect email or password")

    def test_04_expired_jwt(self):
        expired_token = create_access_token(
            subject="1",
            role="ADMIN",
            expires_delta=timedelta(minutes=-10)
        )
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/v1/auth/me", headers=headers)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Could not validate credentials")

    def test_05_malformed_jwt(self):
        headers = {"Authorization": "Bearer invalid.malformed.jwttokenstring"}
        response = client.get("/api/v1/auth/me", headers=headers)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Could not validate credentials")

    def test_06_invalid_signature(self):
        bad_secret_token = jwt.encode(
            {"sub": "1", "role": "ADMIN", "exp": datetime.now(timezone.utc) + timedelta(minutes=15)},
            "wrong-secret-key-attacker-signature",
            algorithm="HS256"
        )
        headers = {"Authorization": f"Bearer {bad_secret_token}"}
        response = client.get("/api/v1/auth/me", headers=headers)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Could not validate credentials")

    def test_07_missing_jwt(self):
        response = client.get("/api/v1/auth/me")
        self.assertEqual(response.status_code, 401)

    def test_08_invalid_sub_claim(self):
        bad_sub_token = jwt.encode(
            {"sub": "invalid_non_numeric_sub", "role": "ADMIN", "exp": datetime.now(timezone.utc) + timedelta(minutes=15)},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        headers = {"Authorization": f"Bearer {bad_sub_token}"}
        response = client.get("/api/v1/auth/me", headers=headers)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Could not validate credentials")

    def test_09_non_existent_user_id(self):
        token = create_access_token(subject=9999999, role="ADMIN")
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/auth/me", headers=headers)
        self.assertEqual(response.status_code, 401)

    def test_10_inactive_user(self):
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == "customer@gmail.com").first()
            user.is_active = False
            db.commit()

            login_res = client.post("/api/v1/auth/login", json={
                "email": "customer@gmail.com",
                "password": "Cust@123"
            })
            self.assertEqual(login_res.status_code, 401)

            user.is_active = True
            db.commit()
        finally:
            db.close()

    def test_11_customer_accessing_admin_endpoint(self):
        cust_login = client.post("/api/v1/auth/login", json={
            "email": "customer@gmail.com",
            "password": "Cust@123"
        }).json()
        cust_headers = {"Authorization": f"Bearer {cust_login['access_token']}"}
        response = client.get("/api/v1/orders/admin/all", headers=cust_headers)
        self.assertEqual(response.status_code, 403)

    def test_12_distributor_accessing_admin_endpoint(self):
        dist_login = client.post("/api/v1/auth/login", json={
            "email": "distributor@medplus.com",
            "password": "Dist@123"
        }).json()
        dist_headers = {"Authorization": f"Bearer {dist_login['access_token']}"}
        response = client.get("/api/v1/users", headers=dist_headers)
        self.assertEqual(response.status_code, 403)

    def test_13_admin_accessing_admin_endpoint(self):
        admin_login = client.post("/api/v1/auth/login", json={
            "email": "admin@pharmalink.com",
            "password": "Admin@123"
        }).json()
        admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}
        response = client.get("/api/v1/reports/dashboard", headers=admin_headers)
        self.assertEqual(response.status_code, 200)

    def test_14_customer_accessing_customer_endpoint(self):
        cust_login = client.post("/api/v1/auth/login", json={
            "email": "customer@gmail.com",
            "password": "Cust@123"
        }).json()
        cust_headers = {"Authorization": f"Bearer {cust_login['access_token']}"}
        response = client.get("/api/v1/orders/my-orders", headers=cust_headers)
        self.assertEqual(response.status_code, 200)

    def test_15_distributor_accessing_distributor_endpoint(self):
        dist_login = client.post("/api/v1/auth/login", json={
            "email": "distributor@medplus.com",
            "password": "Dist@123"
        }).json()
        dist_headers = {"Authorization": f"Bearer {dist_login['access_token']}"}
        response = client.get("/api/v1/products", headers=dist_headers)
        self.assertEqual(response.status_code, 200)

    def test_16_optional_auth_no_token(self):
        db = SessionLocal()
        try:
            user = get_current_user_optional(token=None, db=db)
            self.assertIsNone(user)
        finally:
            db.close()

    def test_17_optional_auth_invalid_token(self):
        db = SessionLocal()
        try:
            user = get_current_user_optional(token="invalid.token.str", db=db)
            self.assertIsNone(user)
        finally:
            db.close()

    def test_18_registration_password_hashing(self):
        reg_email = f"testsec_{datetime.now().timestamp()}@pharmatest.com"
        raw_pass = "SecurePass123!"
        res = client.post("/api/v1/auth/register-customer", json={
            "email": reg_email,
            "password": raw_pass,
            "full_name": "Test Plaintext Security"
        })
        self.assertEqual(res.status_code, 200)
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == reg_email).first()
            self.assertIsNotNone(user)
            self.assertNotEqual(user.hashed_password, raw_pass)
            self.assertTrue(user.hashed_password.startswith("$2b$") or user.hashed_password.startswith("$2a$"))
        finally:
            db.close()

    def test_19_audit_log_sensitive_data_redaction(self):
        db = SessionLocal()
        try:
            log = record_audit(
                db=db,
                action="TEST_ACTION",
                module="AUTH",
                details='User password="MySecretPassword123!" Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.test secret="TEST_RAZORPAY_SECRET_123"'
            )
            self.assertNotIn("MySecretPassword123!", log.details)
            self.assertNotIn("TEST_RAZORPAY_SECRET_123", log.details)
            self.assertIn("[REDACTED]", log.details)
        finally:
            db.close()

    def test_20_malformed_auth_inputs_resilience(self):
        malformed_headers = [
            {"Authorization": "Bearer "},
            {"Authorization": "Bearer {}"},
            {"Authorization": "Bearer 12345"},
            {"Authorization": "Bearer ' OR '1'='1"},
            {"Authorization": "Bearer " + "A" * 5000},
        ]
        for h in malformed_headers:
            response = client.get("/api/v1/auth/me", headers=h)
            self.assertIn(response.status_code, [401, 422])
            self.assertNotEqual(response.status_code, 500)

    def test_21_login_rate_limiting(self):
        rate_test_email = f"ratetest_{datetime.now().timestamp()}@pharmalink.com"
        for i in range(5):
            res = client.post("/api/v1/auth/login", json={"email": rate_test_email, "password": "WrongPassword123"})
            self.assertEqual(res.status_code, 401)
        
        # 6th attempt must trigger HTTP 429
        rate_res = client.post("/api/v1/auth/login", json={"email": rate_test_email, "password": "WrongPassword123"})
        self.assertEqual(rate_res.status_code, 429)
        self.assertIn("Too many failed login attempts", rate_res.json()["detail"])

    def test_22_idor_customer_order(self):
        cust_a_login = client.post("/api/v1/auth/login", json={"email": "customer@gmail.com", "password": "Cust@123"}).json()
        cust_a_headers = {"Authorization": f"Bearer {cust_a_login['access_token']}"}

        cust_b_email = f"cust_b_{datetime.now().timestamp()}@gmail.com"
        cust_b_res = client.post("/api/v1/auth/register-customer", json={
            "email": cust_b_email,
            "password": "CustB@123",
            "full_name": "Customer B"
        }).json()
        cust_b_headers = {"Authorization": f"Bearer {cust_b_res['access_token']}"}

        order_b_res = client.post("/api/v1/orders", json={
            "items": [{"product_id": 1, "quantity": 1}],
            "customer_name": "Customer B",
            "delivery_address": "Street B",
            "delivery_city": "City B",
            "delivery_state": "State B",
            "delivery_pincode": "500002"
        }, headers=cust_b_headers).json()
        order_b_id = order_b_res.get("id")

        idor_res = client.get(f"/api/v1/orders/{order_b_id}", headers=cust_a_headers)
        self.assertEqual(idor_res.status_code, 403)

    def test_23_idor_customer_invoice(self):
        cust_a_login = client.post("/api/v1/auth/login", json={"email": "customer@gmail.com", "password": "Cust@123"}).json()
        cust_a_headers = {"Authorization": f"Bearer {cust_a_login['access_token']}"}

        cust_b_email = f"cust_b_inv_{datetime.now().timestamp()}@gmail.com"
        cust_b_res = client.post("/api/v1/auth/register-customer", json={
            "email": cust_b_email,
            "password": "CustB@123",
            "full_name": "Customer B"
        }).json()
        cust_b_headers = {"Authorization": f"Bearer {cust_b_res['access_token']}"}

        order_b_res = client.post("/api/v1/orders", json={
            "items": [{"product_id": 1, "quantity": 1}],
            "customer_name": "Customer B",
            "delivery_address": "Street B",
            "delivery_city": "City B",
            "delivery_state": "State B",
            "delivery_pincode": "500002"
        }, headers=cust_b_headers).json()
        order_b_id = order_b_res.get("id")
        if not order_b_id:
            self.fail(f"Order B creation failed: {order_b_res}")

        idor_inv_res = client.get(f"/api/v1/orders/{order_b_id}/invoice", headers=cust_a_headers)
        self.assertEqual(idor_inv_res.status_code, 403)

    def test_24_bola_customer_admin_kyc_pending(self):
        cust_login = client.post("/api/v1/auth/login", json={"email": "customer@gmail.com", "password": "Cust@123"}).json()
        cust_headers = {"Authorization": f"Bearer {cust_login['access_token']}"}
        res = client.get("/api/v1/kyc/pending", headers=cust_headers)
        self.assertEqual(res.status_code, 403)

    def test_25_bola_distributor_admin_kyc_review(self):
        dist_login = client.post("/api/v1/auth/login", json={"email": "distributor@medplus.com", "password": "Dist@123"}).json()
        dist_headers = {"Authorization": f"Bearer {dist_login['access_token']}"}
        res = client.post("/api/v1/kyc/1/review", json={"status": "APPROVED", "admin_remarks": "Attacker attempt"}, headers=dist_headers)
        self.assertEqual(res.status_code, 403)

    def test_26_bola_customer_admin_toggle_user_status(self):
        cust_login = client.post("/api/v1/auth/login", json={"email": "customer@gmail.com", "password": "Cust@123"}).json()
        cust_headers = {"Authorization": f"Bearer {cust_login['access_token']}"}
        res = client.patch("/api/v1/users/1/toggle-status", headers=cust_headers)
        self.assertEqual(res.status_code, 403)


if __name__ == "__main__":
    unittest.main()
