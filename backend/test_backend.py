import sys
import os

# Put backend folder on sys.path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BACKEND_DIR)

# Force isolated test database
TEST_DB_PATH = os.path.join(BACKEND_DIR, "pharmalink_test.db").replace("\\", "/")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from fastapi.testclient import TestClient
from app.main import app
from app.seeds.seed_data import seed_database

client = TestClient(app)


def test_complete_backend_workflow():
    print("\n--- 1. Testing Database Seeding & Startup ---")
    seed_database()
    response = client.get("/")
    assert response.status_code == 200, f"Root endpoint failed: {response.text}"
    print(" Root health check OK:", response.json())

    print("\n--- 2. Testing Authentication (Admin, Distributor, Customer) ---")
    # Admin Login
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@pharmalink.com",
        "password": "Admin@123"
    })
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(" Admin Login successful! Role:", admin_login.json()["role"])

    # Distributor Login
    dist_login = client.post("/api/v1/auth/login", json={
        "email": "distributor@medplus.com",
        "password": "Dist@123"
    })
    assert dist_login.status_code == 200, f"Distributor login failed: {dist_login.text}"
    dist_token = dist_login.json()["access_token"]
    dist_headers = {"Authorization": f"Bearer {dist_token}"}
    print(" Distributor Login successful! KYC Status:", dist_login.json()["kyc_status"])

    # Customer Login
    cust_login = client.post("/api/v1/auth/login", json={
        "email": "customer@gmail.com",
        "password": "Cust@123"
    })
    assert cust_login.status_code == 200, f"Customer login failed: {cust_login.text}"
    cust_token = cust_login.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    print(" Customer Login successful! Role:", cust_login.json()["role"])

    print("\n--- 3. Testing Role-Based Dynamic Pricing Logic ---")
    # Guest / Customer View
    cust_products = client.get("/api/v1/products", headers=cust_headers).json()
    zene_cust = next(p for p in cust_products if p["sku"] == "EVV-ZEN-001")
    print(f" Customer View: {zene_cust['name']} -> Display Price: INR {zene_cust['display_price']} (Distributor price hidden: {zene_cust['distributor_price'] is None})")
    assert zene_cust["display_price"] == 395.0
    assert zene_cust["distributor_price"] is None

    # Distributor View
    dist_products = client.get("/api/v1/products", headers=dist_headers).json()
    zene_dist = next(p for p in dist_products if p["sku"] == "EVV-ZEN-001")
    print(f" Distributor View: {zene_dist['name']} -> Display Price: INR {zene_dist['display_price']} (Bulk MOQ: {zene_dist['bulk_moq']} @ INR {zene_dist['bulk_price']})")
    assert zene_dist["display_price"] in [280.0, 300.0]
    assert zene_dist["bulk_price"] == 250.0

    print("\n--- 4. Testing Order Placement & Stock Deduction ---")
    # Customer places order
    order_payload = {
        "items": [{"product_id": zene_cust["id"], "quantity": 2}],
        "customer_name": "Kavita Reddy",
        "customer_phone": "+91 9988776655",
        "delivery_address": "Flat 402, Green Meadows",
        "delivery_city": "Hyderabad",
        "delivery_state": "Telangana",
        "delivery_pincode": "500081",
        "payment_method": "UPI"
    }
    order_res = client.post("/api/v1/orders", json=order_payload, headers=cust_headers)
    assert order_res.status_code == 201, f"Order placement failed: {order_res.text}"
    placed_order = order_res.json()
    print(f" Placed Order: {placed_order['order_code']} | Subtotal: INR {placed_order['subtotal']} | Total: INR {placed_order['total_amount']}")
    assert placed_order["subtotal"] == 790.0  # 2 * 395.0

    # Verify Invoice
    inv_res = client.get(f"/api/v1/orders/{placed_order['id']}/invoice", headers=cust_headers)
    assert inv_res.status_code == 200
    print(f" Generated Invoice: {inv_res.json()['invoice_number']} for buyer: {inv_res.json()['buyer_name']}")

    print("\n--- 5. Testing RBAC Security Restrictions ---")
    # Customer attempts to access Admin all-orders endpoint -> Should fail with 403 Forbidden
    forbidden_res = client.get("/api/v1/orders/admin/all", headers=cust_headers)
    assert forbidden_res.status_code == 403, f"Expected 403 but got {forbidden_res.status_code}"
    print(" RBAC Security verified: Customer blocked from Admin endpoint (HTTP 403 Forbidden).")

    print("\n--- 6. Testing Admin Dashboard & KYC Approval ---")
    # Admin checks dashboard summary
    dash_res = client.get("/api/v1/reports/dashboard", headers=admin_headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    print(f" Admin Dashboard: Total Sales=INR {dash_data['total_sales_all_time']}, Total Products={dash_data['total_products']}, Pending KYC={dash_data['pending_kyc_count']}")

    # Admin reviews pending KYC
    kyc_list = client.get("/api/v1/kyc/pending", headers=admin_headers).json()
    print(f" Admin retrieved {len(kyc_list)} KYC submissions.")
    if kyc_list:
        pending_sub = next((k for k in kyc_list if k["verification_status"] == "PENDING"), None)
        if pending_sub:
            review_res = client.post(
                f"/api/v1/kyc/{pending_sub['id']}/review",
                json={"status": "APPROVED", "admin_remarks": "Approved verified drug license via test."},
                headers=admin_headers
            )
            assert review_res.status_code == 200
            print(f" KYC {pending_sub['id']} successfully APPROVED by Admin!")

    print("\n ALL BACKEND TESTS PASSED SUCCESSFULLY! ")


if __name__ == "__main__":
    test_complete_backend_workflow()
