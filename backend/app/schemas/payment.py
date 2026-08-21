from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.order import OrderCreateRequest, OrderItemCreate


class PaymentPublicConfigOut(BaseModel):
    key_id: str
    is_active: bool
    mode: str
    currency: str
    cod_enabled: bool
    stripe_active: Optional[bool] = False
    stripe_publishable_key: Optional[str] = ""
    paypal_active: Optional[bool] = False
    paypal_client_id: Optional[str] = ""
    wire_enabled: Optional[bool] = True


class RazorpayOrderCreateRequest(BaseModel):
    items: Optional[List[OrderItemCreate]] = None
    amount: Optional[float] = Field(None, gt=0, description="Amount in INR rupees (optional if items provided)")
    currency: str = "INR"
    notes: Optional[Dict[str, Any]] = None


class RazorpayOrderOut(BaseModel):
    razorpay_order_id: str
    payment_attempt_id: Optional[str] = None
    amount: int  # in paise
    currency: str
    key_id: str


class RazorpayVerifyAndOrderRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    order_data: OrderCreateRequest


class PaymentTransactionOut(BaseModel):
    id: int
    payment_attempt_id: str
    user_id: int
    application_order_id: Optional[int] = None
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    expected_amount: float
    currency: str
    status: str
    refund_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True



class PaymentAdminSettingsOut(BaseModel):
    id: int
    gateway_name: str
    key_id: str
    key_secret_masked: str
    is_active: bool
    mode: str
    currency: str
    cod_enabled: bool
    auto_capture: bool

    # Multi-Gateway Output Fields
    stripe_active: Optional[bool] = False
    stripe_mode: Optional[str] = "test"
    stripe_publishable_key: Optional[str] = ""
    stripe_secret_masked: Optional[str] = ""

    paypal_active: Optional[bool] = False
    paypal_mode: Optional[str] = "sandbox"
    paypal_client_id: Optional[str] = ""
    paypal_secret_masked: Optional[str] = ""

    wire_enabled: Optional[bool] = True
    bank_name: Optional[str] = "HDFC Bank Ltd"
    account_no: Optional[str] = "50200012345678"
    ifsc_code: Optional[str] = "HDFC0001234"

    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaymentAdminSettingsUpdateRequest(BaseModel):
    key_id: Optional[str] = None
    key_secret: Optional[str] = None
    is_active: Optional[bool] = None
    mode: Optional[str] = None  # "test" | "live"
    currency: Optional[str] = None
    cod_enabled: Optional[bool] = None

    # Multi-Gateway Update Fields
    stripe_active: Optional[bool] = None
    stripe_mode: Optional[str] = None
    stripe_publishable_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None

    paypal_active: Optional[bool] = None
    paypal_mode: Optional[str] = None
    paypal_client_id: Optional[str] = None
    paypal_secret: Optional[str] = None

    wire_enabled: Optional[bool] = None
    bank_name: Optional[str] = None
    account_no: Optional[str] = None
    ifsc_code: Optional[str] = None
