import urllib.request
import json

data = json.dumps({"email": "customer@gmail.com", "password": "Cust@123"}).encode("utf-8")
req = urllib.request.Request(
    "http://127.0.0.1:8000/api/v1/auth/login",
    data=data,
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Response:", response.read().decode("utf-8")[:150])
except Exception as e:
    print("Error:", e)
    if hasattr(e, "read"):
        print("Error detail:", e.read().decode("utf-8"))
