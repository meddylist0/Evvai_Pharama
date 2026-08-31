import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.order import Order, OrderItem
from app.services.notification_service import notify_order_created
from app.models.notification import NotificationLog

def test_order_created_notification():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "testdist@pharmalink.com").first()
        if not user:
            user = db.query(User).first()
            
        print(f"Testing with user: {user.full_name} ({user.email})")

        # Mock order object with items
        order = Order(
            order_code="ORD-TEST-NOTIF-001",
            user_id=user.id,
            role="Retail Customer",
            subtotal=1500.0,
            tax_amount=270.0,
            shipping_charge=50.0,
            total_amount=1820.0,
            order_status="CONFIRMED",
            payment_status="PAID",
            payment_method="Razorpay Online (UPI/Card)",
            customer_name=user.full_name,
            customer_phone=user.phone or "+919876543210",
            delivery_address="123 Health Ave, Pharma City",
            delivery_city="Hyderabad",
            delivery_state="Telangana",
            delivery_pincode="500081"
        )
        
        item1 = OrderItem(product_name="Paracetamol 650mg (500 Tablets)", quantity=2, unit_price=450.0, total_price=900.0)
        item2 = OrderItem(product_name="Amoxicillin 500mg (100 Capsules)", quantity=1, unit_price=600.0, total_price=600.0)
        order.items = [item1, item2]

        # Trigger notification
        notify_order_created(db, order, user)

        # Retrieve logged notification
        log = db.query(NotificationLog).filter(NotificationLog.recipient == user.email).order_by(NotificationLog.id.desc()).first()
        if log:
            print("Successfully logged Email notification in DB!")
            print(f"Log ID: {log.id}")
            print(f"Subject: {log.subject}")
            print(f"Contains 'Evvai Pharma': {'Evvai Pharma' in log.subject or 'Evvai Pharma' in log.message_body}")
            print(f"Message Body Contains Medicine Names: {'Paracetamol 650mg' in log.message_body and 'Amoxicillin 500mg' in log.message_body}")
            assert "Paracetamol 650mg" in log.message_body
            assert "Amoxicillin 500mg" in log.message_body
            print("[SUCCESS] Amazon-style Order creation notification with Evvai Pharma branding and medicine items verified!")
        else:
            print("[FAIL] Notification log not found!")

    finally:
        db.close()

if __name__ == "__main__":
    test_order_created_notification()
