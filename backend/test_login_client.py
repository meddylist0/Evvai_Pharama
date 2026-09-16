import sys
sys.path.insert(0, ".")
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
res = client.post(
    "/api/v1/auth/login",
    json={"email": "customer@gmail.com", "password": "Cust@123"}
)
print("Status:", res.status_code)
print("Body:", res.json())
