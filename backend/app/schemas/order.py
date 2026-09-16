from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.models.order import OrderStatus, PaymentStatus


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    carton_quantity: Optional[int] = 0
    pack_quantity: Optional[int] = None
    scheme_free_quantity: Optional[int] = 0
    scheme_name: Optional[str] = None


class OrderCreateRequest(BaseModel):
    items: List[OrderItemCreate]
    customer_name: str
    customer_phone: Optional[str] = None
    gstin: Optional[str] = None
    delivery_address: str
    delivery_city: str
    delivery_state: str
    delivery_pincode: str
    payment_method: Optional[str] = "UPI/Card"


class OrderStatusUpdateRequest(BaseModel):
    order_status: OrderStatus
    admin_notes: Optional[str] = None
    tracking_number: Optional[str] = None


class OrderItemBatchAllocationOut(BaseModel):
    id: int
    order_item_id: int
    batch_id: Optional[int] = None
    batch_no: str
    quantity: int
    created_at: datetime

    class Config:
        from_attributes = True


class OrderItemOut(BaseModel):
    id: int
    product_id: Optional[int] = None  # nullable after product hard-delete
    product_name: str
    sku: str
    batch_no: Optional[str] = None
    unit_price: float
    quantity: int
    total_price: float
    batch_allocations: List[OrderItemBatchAllocationOut] = []

    class Config:
        from_attributes = True



class OrderOut(BaseModel):
    id: int
    order_code: str
    user_id: int
    role: str
    customer_name: str
    customer_phone: Optional[str] = None
    gstin: Optional[str] = None
    delivery_address: str
    delivery_city: str
    delivery_state: str
    delivery_pincode: str
    subtotal: float
    discount_amount: float
    tax_amount: float
    shipping_charge: float
    total_amount: float
    order_status: OrderStatus
    payment_status: PaymentStatus
    payment_method: str
    invoice_number: Optional[str] = None
    tracking_number: Optional[str] = None
    admin_notes: Optional[str] = None
    refund_id: Optional[str] = None
    refund_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True


class InvoiceOut(BaseModel):
    invoice_number: str
    order_code: str
    invoice_date: datetime
    company_name: str = "EVVAI Pharmaceuticals Private Limited"
    company_gstin: str = "36AAACE1234F1Z5"
    company_address: str = "Survey 45/B, Genome Valley, Hyderabad, Telangana - 500078"
    buyer_name: str
    buyer_role: str
    buyer_gstin: Optional[str] = None
    buyer_address: str
    subtotal: float
    tax_amount: float
    total_amount: float
    payment_status: str
    items: List[OrderItemOut] = []
