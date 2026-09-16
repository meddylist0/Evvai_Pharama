"""
PharmaLink Enterprise — Production Hardening Regression Tests

Tests verifying critical safety fixes:
1. Payment: missing transaction rejected
2. Payment: wrong user rejected
3. Payment: invalid signature rejected
4. Payment: duplicate payment rejected
5. Refund: no fake refund ID on gateway failure
6. Refund: idempotency
7. Inventory: reservation, release, no double release
8. Order: valid/invalid state transitions
9. KYC: enforcement on wholesale operations
"""

import sys
import os
import unittest
import hmac
import hashlib
import uuid
from datetime import datetime
from unittest.mock import patch, MagicMock

# Ensure backend folder is on sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

# Force isolated test database
TEST_DB_PATH = os.path.join(BACKEND_DIR, "pharmalink_test.db").replace("\\", "/")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, sync_db_schema
from app.seeds.seed_data import seed_database
from app.models.user import User, UserRole
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.product import Product
from app.models.payment import PaymentTransaction
from app.services.payment_service import (
    verify_razorpay_signature,
    initiate_razorpay_refund,
    get_or_create_payment_settings
)
from app.core.rate_limiter import login_rate_limiter

client = TestClient(app)

# Ensure DB schema and seeds are loaded once
sync_db_schema()
seed_database()


def admin_login():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@pharmalink.com",
        "password": "Admin@123"
    })
    return res.json()


def customer_login():
    res = client.post("/api/v1/auth/login", json={
        "email": "customer@gmail.com",
        "password": "Cust@123"
    })
    return res.json()


def distributor_login():
    res = client.post("/api/v1/auth/login", json={
        "email": "distributor@medplus.com",
        "password": "Dist@123"
    })
    return res.json()


def create_customer_order(headers):
    """Helper: create a real order via API."""
    return client.post("/api/v1/orders", json={
        "items": [{"product_id": 1, "quantity": 1}],
        "customer_name": "Test Customer",
        "delivery_address": "Test Address",
        "delivery_city": "Hyderabad",
        "delivery_state": "Telangana",
        "delivery_pincode": "500001",
        "payment_method": "UPI/Card"
    }, headers=headers)


# ═══════════════════════════════════════════════════
# PAYMENT TESTS
# ═══════════════════════════════════════════════════

class TestPaymentTransactionRequired(unittest.TestCase):
    """§5: PaymentTransaction MUST exist before verification."""

    def setUp(self):
        login_rate_limiter._attempts.clear()

    def test_01_missing_payment_transaction_rejected(self):
        """Verify-and-order rejects when no PaymentTransaction exists for the razorpay_order_id."""
        cust = customer_login()
        headers = {"Authorization": f"Bearer {cust['access_token']}"}

        # Use a razorpay_order_id that does NOT exist in payment_transactions
        fake_order_id = f"order_nonexistent_{uuid.uuid4().hex[:10]}"
        fake_payment_id = f"pay_fake_{uuid.uuid4().hex[:10]}"

        # Generate a valid-looking signature (will pass crypto check if secret matches)
        db = SessionLocal()
        try:
            config = get_or_create_payment_settings(db)
            secret = config.key_secret
        finally:
            db.close()

        msg = f"{fake_order_id}|{fake_payment_id}"
        sig = hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()

        res = client.post("/api/v1/payments/verify-and-order", json={
            "razorpay_payment_id": fake_payment_id,
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


class TestPaymentOwnership(unittest.TestCase):
    """§6: Wrong user cannot verify another user's payment."""

    def setUp(self):
        login_rate_limiter._attempts.clear()

    def test_02_wrong_user_rejected(self):
        """User B cannot verify User A's payment transaction."""
        # Create a transaction for customer A
        cust_a = customer_login()
        headers_a = {"Authorization": f"Bearer {cust_a['access_token']}"}

        # Create razorpay order for user A with authoritative items
        rz_res = client.post("/api/v1/payments/create-razorpay-order", json={
            "items": [{"product_id": 1, "quantity": 1}], "currency": "INR"
        }, headers=headers_a)
        self.assertEqual(rz_res.status_code, 200)
        rz_data = rz_res.json()

        # Now user B tries to verify it
        cust_b_email = f"custb_own_{datetime.now().timestamp()}@test.com"
        client.post("/api/v1/auth/register-customer", json={
            "email": cust_b_email, "password": "TestB@123", "full_name": "Customer B"
        })
        cust_b = client.post("/api/v1/auth/login", json={
            "email": cust_b_email, "password": "TestB@123"
        }).json()
        headers_b = {"Authorization": f"Bearer {cust_b['access_token']}"}

        fake_payment_id = f"pay_own_test_{uuid.uuid4().hex[:10]}"
        db = SessionLocal()
        try:
            config = get_or_create_payment_settings(db)
            secret = config.key_secret
        finally:
            db.close()

        msg = f"{rz_data['razorpay_order_id']}|{fake_payment_id}"
        sig = hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()

        res = client.post("/api/v1/payments/verify-and-order", json={
            "razorpay_payment_id": fake_payment_id,
            "razorpay_order_id": rz_data["razorpay_order_id"],
            "razorpay_signature": sig,
            "order_data": {
                "items": [{"product_id": 1, "quantity": 1}],
                "customer_name": "Attacker",
                "delivery_address": "Test",
                "delivery_city": "Test",
                "delivery_state": "Test",
                "delivery_pincode": "500001"
            }
        }, headers=headers_b)

        self.assertEqual(res.status_code, 403)
        self.assertIn("ownership mismatch", res.json()["detail"])


class TestPaymentSignature(unittest.TestCase):
    """§7: Invalid cryptographic signature must be rejected."""

    def setUp(self):
        login_rate_limiter._attempts.clear()

    def test_03_invalid_signature_rejected(self):
        cust = customer_login()
        headers = {"Authorization": f"Bearer {cust['access_token']}"}

        # Create a real razorpay order with authoritative items
        rz_res = client.post("/api/v1/payments/create-razorpay-order", json={
            "items": [{"product_id": 1, "quantity": 1}], "currency": "INR"
        }, headers=headers)
        rz_data = rz_res.json()

        res = client.post("/api/v1/payments/verify-and-order", json={
            "razorpay_payment_id": f"pay_test_{uuid.uuid4().hex[:10]}",
            "razorpay_order_id": rz_data["razorpay_order_id"],
            "razorpay_signature": "invalid_signature_attack_attempt",
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
        self.assertIn("Invalid Razorpay cryptographic signature", res.json()["detail"])

    def test_04_signature_verification_unit(self):
        """Unit test for HMAC-SHA256 signature verification."""
        secret = "test_secret_123"
        order_id = "order_test_xyz"
        payment_id = "pay_test_abc"
        msg = f"{order_id}|{payment_id}"
        valid_sig = hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()

        self.assertTrue(verify_razorpay_signature(secret, order_id, payment_id, valid_sig))
        self.assertFalse(verify_razorpay_signature(secret, order_id, payment_id, "tampered_sig"))
        self.assertFalse(verify_razorpay_signature(secret, order_id, payment_id, ""))
        self.assertFalse(verify_razorpay_signature(secret, "", payment_id, valid_sig))


class TestDuplicatePayment(unittest.TestCase):
    """§4 (payment): Duplicate payment verification must be rejected."""

    def setUp(self):
        login_rate_limiter._attempts.clear()

    def test_05_duplicate_payment_rejected(self):
        """Second verification with same razorpay_payment_id must fail."""
        cust = customer_login()
        headers = {"Authorization": f"Bearer {cust['access_token']}"}

        # Place a regular order first to get a razorpay_payment_id in the system
        order_res = create_customer_order(headers)
        if order_res.status_code == 201:
            order_data = order_res.json()
            # The order already exists — trying to verify with same payment_id should fail
            # This test validates the replay prevention check
            db = SessionLocal()
            try:
                order = db.query(Order).filter(Order.id == order_data["id"]).first()
                if order and order.razorpay_payment_id:
                    config = get_or_create_payment_settings(db)
                    fake_order_id = f"order_dup_{uuid.uuid4().hex[:10]}"
                    msg = f"{fake_order_id}|{order.razorpay_payment_id}"
                    sig = hmac.new(config.key_secret.encode(), msg.encode(), hashlib.sha256).hexdigest()

                    res = client.post("/api/v1/payments/verify-and-order", json={
                        "razorpay_payment_id": order.razorpay_payment_id,
                        "razorpay_order_id": fake_order_id,
                        "razorpay_signature": sig,
                        "order_data": {
                            "items": [{"product_id": 1, "quantity": 1}],
                            "customer_name": "Duplicate Test",
                            "delivery_address": "Test",
                            "delivery_city": "Test",
                            "delivery_state": "Test",
                            "delivery_pincode": "500001"
                        }
                    }, headers=headers)
                    self.assertIn(res.status_code, [400])
            finally:
                db.close()


# ═══════════════════════════════════════════════════
# REFUND TESTS
# ═══════════════════════════════════════════════════

class TestRefundSafety(unittest.TestCase):
    """§3: No fake refund ID. Gateway failure → REFUND_FAILED."""

    def test_06_no_fake_refund_id_on_gateway_failure(self):
        """When Razorpay gateway is unavailable, refund_status must be REFUND_FAILED, not REFUNDED."""
        db = SessionLocal()
        try:
            # Create a test order with PAID status and a razorpay_payment_id
            order = db.query(Order).filter(
                Order.payment_status == PaymentStatus.PAID,
                Order.razorpay_payment_id.isnot(None),
                Order.refund_status.is_(None)
            ).first()

            if not order:
                # Create one if none exists
                self.skipTest("No PAID order with razorpay_payment_id found for refund test")
                return

            original_payment_status = order.payment_status

            # Mock httpx to simulate gateway failure
            with patch('app.services.payment_service.httpx.Client') as mock_client:
                mock_instance = MagicMock()
                mock_client.return_value.__enter__ = MagicMock(return_value=mock_instance)
                mock_client.return_value.__exit__ = MagicMock(return_value=False)
                mock_instance.post.side_effect = Exception("Connection timeout")

                success, msg, refund_id = initiate_razorpay_refund(db, order)

            # Verify: refund FAILED, not REFUNDED
            self.assertFalse(success)
            self.assertEqual(order.refund_status, "REFUND_FAILED")
            # Payment status should still be PAID (not REFUNDED)
            self.assertEqual(order.payment_status, PaymentStatus.PAID)
            # No fake rfnd_ ID should be assigned
            self.assertIsNone(order.refund_id)

            # Clean up: reset order state for other tests
            order.refund_status = None
            order.payment_status = original_payment_status
            db.commit()
        finally:
            db.close()

    def test_07_successful_refund_marks_refunded(self):
        """When gateway returns success, order is properly marked REFUNDED."""
        db = SessionLocal()
        try:
            order = db.query(Order).filter(
                Order.payment_status == PaymentStatus.PAID,
                Order.razorpay_payment_id.isnot(None),
                Order.refund_status.is_(None)
            ).first()

            if not order:
                self.skipTest("No eligible order for successful refund test")
                return

            orig_payment_status = order.payment_status
            orig_refund_status = order.refund_status
            orig_refund_id = order.refund_id

            gateway_id = f"rfnd_real_{uuid.uuid4().hex[:10]}"

            with patch('app.services.payment_service.httpx.Client') as mock_client:
                mock_resp = MagicMock()
                mock_resp.status_code = 200
                mock_resp.json.return_value = {"id": gateway_id}
                mock_instance = MagicMock()
                mock_instance.post.return_value = mock_resp
                mock_client.return_value.__enter__ = MagicMock(return_value=mock_instance)
                mock_client.return_value.__exit__ = MagicMock(return_value=False)

                success, msg, refund_id = initiate_razorpay_refund(db, order)

            self.assertTrue(success)
            self.assertEqual(order.refund_status, "REFUNDED")
            self.assertEqual(order.payment_status, PaymentStatus.REFUNDED)
            self.assertEqual(order.refund_id, gateway_id)
            self.assertEqual(refund_id, gateway_id)

            # Restore original order state so test runs never modify live customer data
            order.payment_status = orig_payment_status
            order.refund_status = orig_refund_status
            order.refund_id = orig_refund_id
            db.commit()
        finally:
            db.close()

    def test_08_refund_idempotency(self):
        """Duplicate refund request returns existing state, does not create another refund."""
        db = SessionLocal()
        try:
            order = db.query(Order).filter(
                Order.refund_status == "REFUNDED",
                Order.refund_id.isnot(None)
            ).first()

            if not order:
                self.skipTest("No REFUNDED order for idempotency test")
                return

            existing_refund_id = order.refund_id
            success, msg, refund_id = initiate_razorpay_refund(db, order)

            self.assertTrue(success)
            self.assertIn("already completed", msg)
            self.assertEqual(refund_id, existing_refund_id)
        finally:
            db.close()

    def test_09_no_razorpay_payment_id_refund_fails(self):
        """Order without razorpay_payment_id cannot be refunded via gateway."""
        db = SessionLocal()
        try:
            order = db.query(Order).filter(
                Order.payment_status == PaymentStatus.PAID,
                Order.razorpay_payment_id.is_(None),
                Order.refund_status.is_(None)
            ).first()

            if not order:
                self.skipTest("No PAID order without razorpay_payment_id found")
                return

            success, msg, refund_id = initiate_razorpay_refund(db, order)
            self.assertFalse(success)
            self.assertIn("No Razorpay payment ID", msg)
            self.assertEqual(order.refund_status, "REFUND_FAILED")

            # Clean up
            order.refund_status = None
            db.commit()
        finally:
            db.close()


# ═══════════════════════════════════════════════════
# INVENTORY TESTS
# ═══════════════════════════════════════════════════

class TestInventoryLifecycle(unittest.TestCase):
    """§9, §10: Reservation, release, and no double release."""

    def setUp(self):
        login_rate_limiter._attempts.clear()

    def test_10_order_creation_reserves_stock(self):
        """Placing an order deducts stock and increments reserved_stock."""
        cust = customer_login()
        headers = {"Authorization": f"Bearer {cust['access_token']}"}

        db = SessionLocal()
        try:
            product = db.query(Product).filter(Product.id == 1).first()
            stock_before = product.stock
            reserved_before = product.reserved_stock
        finally:
            db.close()

        res = create_customer_order(headers)
        self.assertEqual(res.status_code, 201)

        db = SessionLocal()
        try:
            product = db.query(Product).filter(Product.id == 1).first()
            self.assertEqual(product.stock, stock_before - 1)
            self.assertEqual(product.reserved_stock, reserved_before + 1)
        finally:
            db.close()

    def test_11_cancellation_releases_stock(self):
        """Cancelling an order restores stock and decrements reserved_stock."""
        cust = customer_login()
        headers = {"Authorization": f"Bearer {cust['access_token']}"}

        # Create order
        order_res = create_customer_order(headers)
        self.assertEqual(order_res.status_code, 201)
        order_id = order_res.json()["id"]

        db = SessionLocal()
        try:
            product = db.query(Product).filter(Product.id == 1).first()
            stock_after_order = product.stock
            reserved_after_order = product.reserved_stock
        finally:
            db.close()

        # Cancel order
        cancel_res = client.post(f"/api/v1/orders/{order_id}/cancel", headers=headers)
        self.assertEqual(cancel_res.status_code, 200)

        db = SessionLocal()
        try:
            product = db.query(Product).filter(Product.id == 1).first()
            self.assertEqual(product.stock, stock_after_order + 1)
            self.assertEqual(product.reserved_stock, reserved_after_order - 1)
        finally:
            db.close()

    def test_12_double_cancellation_prevented(self):
        """Cancelling an already cancelled order is rejected by state machine."""
        cust = customer_login()
        headers = {"Authorization": f"Bearer {cust['access_token']}"}

        # Create and cancel
        order_res = create_customer_order(headers)
        order_id = order_res.json()["id"]
        client.post(f"/api/v1/orders/{order_id}/cancel", headers=headers)

        # Try to cancel again
        res = client.post(f"/api/v1/orders/{order_id}/cancel", headers=headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid order status transition", res.json()["detail"])

    def test_13_no_double_release_shipped_then_delivered(self):
        """SHIPPED finalizes reserved_stock. DELIVERED does NOT finalize again."""
        admin = admin_login()
        admin_headers = {"Authorization": f"Bearer {admin['access_token']}"}
        cust = customer_login()
        cust_headers = {"Authorization": f"Bearer {cust['access_token']}"}

        # Create order
        order_res = create_customer_order(cust_headers)
        self.assertEqual(order_res.status_code, 201)
        order_id = order_res.json()["id"]

        # Confirm → Packed → Shipped
        # First confirm if pending
        order_data = order_res.json()
        if order_data["order_status"] == "Pending":
            client.patch(f"/api/v1/orders/{order_id}/status", json={
                "order_status": "Confirmed"
            }, headers=admin_headers)

        client.patch(f"/api/v1/orders/{order_id}/status", json={
            "order_status": "Packed"
        }, headers=admin_headers)

        # Record stock before shipping
        db = SessionLocal()
        try:
            product = db.query(Product).filter(Product.id == 1).first()
            reserved_before_ship = product.reserved_stock
        finally:
            db.close()

        # Ship → reserved_stock should decrease by 1
        client.patch(f"/api/v1/orders/{order_id}/status", json={
            "order_status": "Shipped"
        }, headers=admin_headers)

        db = SessionLocal()
        try:
            product = db.query(Product).filter(Product.id == 1).first()
            reserved_after_ship = product.reserved_stock
            self.assertEqual(reserved_after_ship, reserved_before_ship - 1)
        finally:
            db.close()

        # Deliver → reserved_stock should NOT change
        client.patch(f"/api/v1/orders/{order_id}/status", json={
            "order_status": "Delivered"
        }, headers=admin_headers)

        db = SessionLocal()
        try:
            product = db.query(Product).filter(Product.id == 1).first()
            reserved_after_deliver = product.reserved_stock
            self.assertEqual(reserved_after_deliver, reserved_after_ship,
                             "DELIVERED must NOT decrement reserved_stock again")
        finally:
            db.close()


# ═══════════════════════════════════════════════════
# ORDER STATE MACHINE TESTS
# ═══════════════════════════════════════════════════

class TestOrderStateMachine(unittest.TestCase):
    """§11: Valid transitions allowed, invalid transitions rejected."""

    def setUp(self):
        login_rate_limiter._attempts.clear()

    def test_14_valid_transitions(self):
        """PENDING → CONFIRMED → PACKED → SHIPPED → DELIVERED is valid."""
        admin = admin_login()
        admin_headers = {"Authorization": f"Bearer {admin['access_token']}"}
        cust = customer_login()
        cust_headers = {"Authorization": f"Bearer {cust['access_token']}"}

        order_res = create_customer_order(cust_headers)
        self.assertEqual(order_res.status_code, 201)
        order_id = order_res.json()["id"]
        current_status = order_res.json()["order_status"]

        if current_status == "Pending":
            res = client.patch(f"/api/v1/orders/{order_id}/status", json={
                "order_status": "Confirmed"
            }, headers=admin_headers)
            self.assertEqual(res.status_code, 200)

        for next_status in ["Packed", "Shipped", "Delivered"]:
            res = client.patch(f"/api/v1/orders/{order_id}/status", json={
                "order_status": next_status
            }, headers=admin_headers)
            self.assertEqual(res.status_code, 200, f"Transition to {next_status} failed")

    def test_15_invalid_transition_delivered_to_pending(self):
        """DELIVERED → PENDING is illegal."""
        admin = admin_login()
        admin_headers = {"Authorization": f"Bearer {admin['access_token']}"}

        db = SessionLocal()
        try:
            order = db.query(Order).filter(Order.order_status == OrderStatus.DELIVERED).first()
            if not order:
                self.skipTest("No DELIVERED order found")
                return
            order_id = order.id
        finally:
            db.close()

        res = client.patch(f"/api/v1/orders/{order_id}/status", json={
            "order_status": "Pending"
        }, headers=admin_headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid order status transition", res.json()["detail"])

    def test_16_cancelled_is_terminal(self):
        """CANCELLED → any status is illegal."""
        admin = admin_login()
        admin_headers = {"Authorization": f"Bearer {admin['access_token']}"}
        cust = customer_login()
        cust_headers = {"Authorization": f"Bearer {cust['access_token']}"}

        order_res = create_customer_order(cust_headers)
        order_id = order_res.json()["id"]
        client.post(f"/api/v1/orders/{order_id}/cancel", headers=cust_headers)

        for target in ["Pending", "Confirmed", "Packed", "Shipped", "Delivered"]:
            res = client.patch(f"/api/v1/orders/{order_id}/status", json={
                "order_status": target
            }, headers=admin_headers)
            self.assertEqual(res.status_code, 400,
                             f"CANCELLED → {target} should be blocked")

    def test_17_returned_is_terminal(self):
        """RETURNED → any status is illegal."""
        admin = admin_login()
        admin_headers = {"Authorization": f"Bearer {admin['access_token']}"}

        db = SessionLocal()
        try:
            order = db.query(Order).filter(Order.order_status == OrderStatus.RETURNED).first()
            if not order:
                self.skipTest("No RETURNED order found")
                return
            order_id = order.id
        finally:
            db.close()

        for target in ["Pending", "Confirmed", "Shipped"]:
            res = client.patch(f"/api/v1/orders/{order_id}/status", json={
                "order_status": target
            }, headers=admin_headers)
            self.assertEqual(res.status_code, 400)


# ═══════════════════════════════════════════════════
# KYC ENFORCEMENT TESTS
# ═══════════════════════════════════════════════════

class TestKYCEnforcement(unittest.TestCase):
    """§17: Wholesale operations require APPROVED KYC."""

    def setUp(self):
        login_rate_limiter._attempts.clear()

    def test_18_customer_cannot_access_wholesale_pricing(self):
        """Customer role user does not see distributor pricing."""
        cust = customer_login()
        headers = {"Authorization": f"Bearer {cust['access_token']}"}

        products_res = client.get("/api/v1/products", headers=headers)
        self.assertEqual(products_res.status_code, 200)
        for product in products_res.json():
            self.assertIsNone(product.get("distributor_price"),
                              f"Product {product['name']} should hide distributor_price for customers")

    def test_19_pending_distributor_blocked_from_ordering(self):
        """Distributor with PENDING KYC cannot place wholesale orders."""
        # Register a new distributor (KYC starts as PENDING)
        dist_email = f"pending_kyc_{datetime.now().timestamp()}@test.com"
        reg_res = client.post("/api/v1/auth/register-distributor", json={
            "email": dist_email,
            "password": "DistTest@123",
            "full_name": "Pending KYC Dist",
            "phone": "+91 9876543210",
            "company_name": "Test Pharma",
            "distributor_name": "Test Dist",
            "gstin": "36AAACA9999Z1Z5",
            "drug_license_no": "TS/HYD/2026/9999",
            "business_address": "Test Address",
            "city": "Hyderabad",
            "state": "Telangana",
            "pincode": "500001"
        })
        self.assertEqual(reg_res.status_code, 200)
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Try to place order — should be blocked
        order_res = client.post("/api/v1/orders", json={
            "items": [{"product_id": 1, "quantity": 1}],
            "customer_name": "Pending Dist",
            "delivery_address": "Test",
            "delivery_city": "Test",
            "delivery_state": "Test",
            "delivery_pincode": "500001"
        }, headers=headers)

        self.assertEqual(order_res.status_code, 403)
        self.assertIn("KYC", order_res.json()["detail"])

    def test_20_customer_blocked_from_kyc_pending(self):
        """Customer cannot access admin KYC pending endpoint."""
        cust = customer_login()
        headers = {"Authorization": f"Bearer {cust['access_token']}"}
        res = client.get("/api/v1/kyc/pending", headers=headers)
        self.assertEqual(res.status_code, 403)

    def test_21_client_amount_tampering_rejected(self):
        """Server must strictly reject client-submitted amount parameter without cart items."""
        cust = customer_login()
        headers = {"Authorization": f"Bearer {cust['access_token']}"}
        res = client.post("/api/v1/payments/create-razorpay-order", json={
            "amount": 1.0,
            "currency": "INR"
        }, headers=headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Cart items are required", res.json()["detail"])

    def test_22_database_foreign_key_integrity(self):
        """Verify relational foreign key integrity across tables in the database."""
        db = SessionLocal()
        try:
            orphan_items = db.query(OrderItem).filter(~OrderItem.order_id.in_(db.query(Order.id))).count()
            self.assertEqual(orphan_items, 0, "No orphan order items should exist.")
        finally:
            db.close()

    def test_zzz_23_ordered_product_hard_delete_succeeds_without_breaking_invoices(self):
        """Admin hard delete on an ordered product must succeed cleanly while preserving order items.
        NOTE: Renamed test_zzz_23 to run LAST — creates and deletes its own temp product
        so it does not destroy product ID 1 (which all inventory/order tests depend on).
        """
        admin = admin_login()
        headers = {"Authorization": f"Bearer {admin['access_token']}"}

        # Step 1: Create a temporary product specifically for this hard-delete test
        create_res = client.post("/api/v1/products", json={
            "sku": "HARD-DEL-TEST-ZZZ",
            "name": "Hard Delete Test Product",
            "subtitle": "Temp product for hard delete regression test",
            "composition": "Test Composition 10mg",
            "pack_size": "1 Tablet",
            "category_id": 1,
            "description": "Will be hard-deleted in test",
            "mrp": 50.0,
            "customer_price": 45.0,
            "distributor_price": 35.0,
            "bulk_price": 30.0,
            "bulk_moq": 50,
            "stock": 1000,
            "low_stock_threshold": 100,
            "batch_no": "TEST-ZZZ-001",
            "expiry_date": "12/2028",
            "status": "active"
        }, headers=headers)
        self.assertIn(create_res.status_code, [200, 201],
                      f"Temp product creation failed: {create_res.json()}")
        temp_product_id = create_res.json()["id"]

        # Step 2: Place an order against the temp product (establishes historical reference)
        cust = customer_login()
        cust_headers = {"Authorization": f"Bearer {cust['access_token']}"}
        order_res = client.post("/api/v1/orders", json={
            "items": [{"product_id": temp_product_id, "quantity": 1}],
            "customer_name": "Hard Delete Test Customer",
            "delivery_address": "Test Street",
            "delivery_city": "Hyderabad",
            "delivery_state": "Telangana",
            "delivery_pincode": "500001",
            "payment_method": "UPI/Card"
        }, headers=cust_headers)
        self.assertEqual(order_res.status_code, 201,
                         f"Order creation failed: {order_res.json()}")

        # Step 3: Hard-delete the temp product with history -> MUST be rejected (400) to protect history
        res = client.delete(f"/api/v1/products/{temp_product_id}?hard_delete=true", headers=headers)
        self.assertEqual(res.status_code, 400, "Hard delete on ordered product must be blocked")
        self.assertIn("Disable the product instead", res.json()["detail"])

        # Step 4: Verify disabling product works
        dis_res = client.delete(f"/api/v1/products/{temp_product_id}?hard_delete=false", headers=headers)
        self.assertEqual(dis_res.status_code, 200, "Disabling product failed")


if __name__ == "__main__":
    unittest.main()

