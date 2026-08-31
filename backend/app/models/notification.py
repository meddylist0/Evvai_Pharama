from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime
from app.core.database import Base


class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True, index=True)
    
    # SMTP Email Configuration
    smtp_host = Column(String(255), default="smtp.gmail.com")
    smtp_port = Column(Integer, default=587)
    smtp_user = Column(String(255), default="notifications@evvaipharma.com")
    smtp_password = Column(String(255), default="app_password_secret")
    sender_email = Column(String(255), default="orders@evvaipharma.com")
    sender_name = Column(String(255), default="Evvai Pharma")
    email_enabled = Column(Boolean, default=True)

    # SMS Gateway Configuration
    sms_provider = Column(String(50), default="Twilio / Fast2SMS")
    sms_api_key = Column(String(255), default="SK_TEST_SMS_9988776655")
    sms_sender_id = Column(String(50), default="EVVAI")
    sms_enabled = Column(Boolean, default=True)

    # Event Trigger Toggles
    notify_order_created = Column(Boolean, default=True)
    notify_order_status = Column(Boolean, default=True)
    notify_kyc_status = Column(Boolean, default=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    recipient = Column(String(255), nullable=False)
    channel = Column(String(20), nullable=False)  # EMAIL or SMS
    event_type = Column(String(50), nullable=False)  # ORDER_CREATED, ORDER_STATUS, KYC_STATUS, TEST
    status = Column(String(20), default="SENT")  # SENT, SIMULATED, FAILED
    subject = Column(String(255), nullable=True)
    message_body = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
