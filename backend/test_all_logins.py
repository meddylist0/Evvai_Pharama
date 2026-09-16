import sys
sys.path.insert(0, ".")
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

for email, pwd in [
    ("customer@gmail.com", "Cust@123"),
    ("distributor@medplus.com", "Dist@123"),
    ("admin@pharmalink.com", "Admin@123"),
    ("retailer@evvaipharma.com", "retailer123"),
]:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    print(f"{email}: Status {res.status_code}, role={res.json().get('role') if res.status_code==200 else res.text}")

