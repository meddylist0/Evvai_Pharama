import sys
import os
import unittest
from fastapi.testclient import TestClient

# Setup paths and force isolated test db
backend_dir = os.path.dirname(os.path.abspath(__file__))
test_db_path = os.path.join(backend_dir, "pharmalink_test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path.replace(chr(92), '/')}"
sys.path.insert(0, backend_dir)

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.product import Product
from app.core.security import create_access_token

client = TestClient(app)

class ComprehensiveUATTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.admin_user = cls.db.query(User).filter(User.role == "ADMIN").first()
        cls.customer_user = cls.db.query(User).filter(User.role == "CUSTOMER").first()
        cls.product = cls.db.query(Product).first()
        
        if not cls.admin_user or not cls.customer_user or not cls.product:
            print("Error: Missing required data in test DB.")
            sys.exit(1)
            
        cls.admin_token = create_access_token(subject=str(cls.admin_user.id), role="ADMIN")
        cls.customer_token = create_access_token(subject=str(cls.customer_user.id), role="CUSTOMER")

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_api_health(self):
        """Test basic API health check endpoint"""
        res = client.get("/health")
        self.assertEqual(res.status_code, 200)

    def test_02_admin_get_users(self):
        """Test that Admin can fetch users (RBAC & Business Logic)"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        res = client.get("/api/v1/users", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    def test_03_customer_get_products(self):
        """Test Customer fetching products list (Inventory API)"""
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        res = client.get("/api/v1/products", headers=headers)
        self.assertEqual(res.status_code, 200)

    def test_04_create_order_workflow(self):
        """UAT: Test Customer placing an order"""
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        
        order_payload = {
            "items": [{"product_id": self.product.id, "quantity": 1}],
            "customer_name": "UAT Tester",
            "delivery_address": "123 UAT Street",
            "delivery_city": "Hyderabad",
            "delivery_state": "TG",
            "delivery_pincode": "500001",
            "payment_method": "UPI/Card"
        }
        
        res = client.post("/api/v1/orders", json=order_payload, headers=headers)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("id", data)
        self.assertEqual(data["order_status"], "Pending")

    def test_05_razorpay_order_generation(self):
        """Test Razorpay Order creation API"""
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        payload = {
            "items": [{"product_id": self.product.id, "quantity": 1}],
            "currency": "INR"
        }
        res = client.post("/api/v1/payments/create-razorpay-order", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("razorpay_order_id", data)

    def test_06_razorpay_signature_rejection(self):
        """Test that Invalid Razorpay Signatures are rejected by backend"""
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        payload = {
            "razorpay_payment_id": "pay_invalid_123",
            "razorpay_order_id": "order_invalid_123",
            "razorpay_signature": "invalid_sig",
            "order_data": {
                "items": [{"product_id": self.product.id, "quantity": 1}],
                "customer_name": "Attacker",
                "delivery_address": "Test",
                "delivery_city": "Test",
                "delivery_state": "Test",
                "delivery_pincode": "500001"
            }
        }
        res = client.post("/api/v1/payments/verify-and-order", json=payload, headers=headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid Razorpay cryptographic signature", res.json()["detail"])

    def test_07_jwt_missing_token(self):
        """Test access without JWT token is rejected (401)"""
        res = client.get("/api/v1/users")
        self.assertEqual(res.status_code, 401)

    def test_08_jwt_invalid_token(self):
        """Test access with invalid JWT token is rejected (401)"""
        headers = {"Authorization": "Bearer invalid.jwt.token.string"}
        res = client.get("/api/v1/users", headers=headers)
        self.assertEqual(res.status_code, 401)
        self.assertIn("Could not validate credentials", res.json()["detail"])

    def test_09_rbac_customer_accessing_admin_endpoint(self):
        """Test that Customer role cannot access Admin-only endpoints (403)"""
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        # /api/v1/users is an admin-only endpoint
        res = client.get("/api/v1/users", headers=headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("Operation not permitted", res.json()["detail"])

    def test_10_invoice_authorization_isolation(self):
        """Test Invoice IDOR: A customer cannot fetch another customer's order invoice"""
        # Create an order using admin token (simulating another user's order)
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        order_payload = {
            "items": [{"product_id": self.product.id, "quantity": 1}],
            "customer_name": "Admin Tester",
            "delivery_address": "Test",
            "delivery_city": "Test",
            "delivery_state": "Test",
            "delivery_pincode": "500001",
            "payment_method": "COD"
        }
        res_order = client.post("/api/v1/orders", json=order_payload, headers=admin_headers)
        self.assertEqual(res_order.status_code, 201)
        order_id = res_order.json()["id"]

        # Try to access it with customer token
        cust_headers = {"Authorization": f"Bearer {self.customer_token}"}
        res_invoice = client.get(f"/api/v1/orders/{order_id}/invoice", headers=cust_headers)
        self.assertIn(res_invoice.status_code, [403, 404]) # Should be forbidden or not found

    def test_11_invoice_amount_reconciliation(self):
        """Test Invoice Amount Reconciliation: Ensure totals match item prices * quantities"""
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        order_payload = {
            "items": [{"product_id": self.product.id, "quantity": 2}],
            "customer_name": "Amount Tester",
            "delivery_address": "Test",
            "delivery_city": "Test",
            "delivery_state": "Test",
            "delivery_pincode": "500001",
            "payment_method": "COD"
        }
        res = client.post("/api/v1/orders", json=order_payload, headers=headers)
        self.assertEqual(res.status_code, 201)
        
        order_data = res.json()
        expected_item_total = self.product.customer_price * 2
        # Usually there's tax and shipping added, we just verify subtotal matches item prices
        self.assertEqual(order_data["subtotal"], expected_item_total)

if __name__ == "__main__":
    with open("custom_test_results.txt", "w") as f:
        runner = unittest.TextTestRunner(stream=f, verbosity=2)
        unittest.main(testRunner=runner, exit=False)
    print("Tests executed. Check custom_test_results.txt for details.")
