import sys
import os
import hmac
import hashlib

# Put backend folder on sys.path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BACKEND_DIR)

# Force isolated test database
TEST_DB_PATH = os.path.join(BACKEND_DIR, "pharmalink_test.db").replace("\\", "/")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from fastapi.testclient import TestClient
from app.main import app
from app.services.payment_service import verify_razorpay_signature

client = TestClient(app)

def test_public_config():
    response = client.get("/api/v1/payments/config")
    print("GET /api/v1/payments/config status:", response.status_code)
    print("Response JSON:", response.json())
    assert response.status_code == 200
    data = response.json()
    assert data["key_id"] == "rzp_test_Bvq9kiuaq8gkcs"
    assert data["is_active"] is True
    print("[PASS] Public Config Test Passed!")

def test_signature_verification():
    secret = "TEST_RAZORPAY_SECRET_123"
    order_id = "order_test_123456"
    payment_id = "pay_test_789012"
    msg = f"{order_id}|{payment_id}"
    valid_sig = hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()
    
    assert verify_razorpay_signature(secret, order_id, payment_id, valid_sig) is True
    assert verify_razorpay_signature(secret, order_id, payment_id, "invalid_sig_here") is False
    print("[PASS] Cryptographic Signature Verification Test Passed!")

if __name__ == "__main__":
    test_public_config()
    test_signature_verification()
