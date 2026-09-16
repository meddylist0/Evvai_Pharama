import sys
sys.path.insert(0, ".")
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash, verify_password

db = SessionLocal()
cust = db.query(User).filter(User.email == "customer@gmail.com").first()
if cust:
    cust.hashed_password = get_password_hash("Cust@123")
    cust.is_active = True
    cust.is_verified = True
    db.commit()
    print("customer@gmail.com password reset to 'Cust@123' successfully!")
    print(f"Verified: {verify_password('Cust@123', cust.hashed_password)}")
else:
    print("User not found!")
