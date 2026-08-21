from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.core.database import Base


class PaymentGatewaySetting(Base):
    __tablename__ = "payment_gateway_settings"

    id = Column(Integer, primary_key=True, index=True)
    gateway_name = Column(String(50), default="Razorpay", unique=True, index=True)
    key_id = Column(String(100), nullable=False)
    key_secret = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    mode = Column(String(20), default="test")  # "test" | "live"
    currency = Column(String(10), default="INR")
    cod_enabled = Column(Boolean, default=True)
    auto_capture = Column(Boolean, default=True)
    
    # Stripe Gateway Fields
    stripe_active = Column(Boolean, default=False)
    stripe_mode = Column(String(20), default="test")
    stripe_publishable_key = Column(String(255), default="")
    stripe_secret_key = Column(String(255), default="")

    # PayPal Gateway Fields
    paypal_active = Column(Boolean, default=False)
    paypal_mode = Column(String(20), default="sandbox")
    paypal_client_id = Column(String(255), default="")
    paypal_secret = Column(String(255), default="")

    # Wire Transfer / NEFT Fields
    wire_enabled = Column(Boolean, default=True)
    bank_name = Column(String(100), default="HDFC Bank Ltd")
    account_no = Column(String(50), default="50200012345678")
    ifsc_code = Column(String(20), default="HDFC0001234")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)



class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    payment_attempt_id = Column(String(100), unique=True, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    application_order_id = Column(Integer, index=True, nullable=True)
    razorpay_order_id = Column(String(100), unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String(100), unique=True, index=True, nullable=True)
    expected_amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(50), default="CREATED", nullable=False)  # CREATED, VERIFIED, FAILED, REFUND_PENDING, REFUNDED, REFUND_FAILED
    refund_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


