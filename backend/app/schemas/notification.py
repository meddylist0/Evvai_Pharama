from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class NotificationSettingSchema(BaseModel):
    id: int
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password_masked: str
    sender_email: str
    sender_name: str
    email_enabled: bool

    sms_provider: str
    sms_api_key_masked: str
    sms_sender_id: str
    sms_enabled: bool

    notify_order_created: bool
    notify_order_status: bool
    notify_kyc_status: bool
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationSettingUpdateSchema(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    sender_email: Optional[str] = None
    sender_name: Optional[str] = None
    email_enabled: Optional[bool] = None

    sms_provider: Optional[str] = None
    sms_api_key: Optional[str] = None
    sms_sender_id: Optional[str] = None
    sms_enabled: Optional[bool] = None

    notify_order_created: Optional[bool] = None
    notify_order_status: Optional[bool] = None
    notify_kyc_status: Optional[bool] = None


class TestNotificationRequest(BaseModel):
    target: str  # Email address or Phone number
    channel: str  # EMAIL or SMS
    message: Optional[str] = None


class NotificationLogSchema(BaseModel):
    id: int
    recipient: str
    channel: str
    event_type: str
    status: str
    subject: Optional[str] = None
    message_body: str
    sent_at: datetime

    class Config:
        from_attributes = True
