from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class CategoryOut(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    sku: str
    name: str
    subtitle: Optional[str] = None
    composition: str
    pack_size: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    mrp: float
    customer_price: float
    distributor_price: float
    bulk_price: float
    bulk_moq: int = 50
    gst_rate: float = 0.12
    hsn_code: str = "3004"
    stock: int = 0
    low_stock_threshold: int = 100
    batch_no: Optional[str] = None
    expiry_date: Optional[str] = None
    image: Optional[str] = None
    status: str = "active"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    subtitle: Optional[str] = None
    composition: Optional[str] = None
    pack_size: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    mrp: Optional[float] = None
    customer_price: Optional[float] = None
    distributor_price: Optional[float] = None
    bulk_price: Optional[float] = None
    bulk_moq: Optional[int] = None
    gst_rate: Optional[float] = None
    hsn_code: Optional[str] = None
    stock: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    batch_no: Optional[str] = None
    expiry_date: Optional[str] = None
    image: Optional[str] = None
    status: Optional[str] = None


class ProductPricingMatrixUpdate(BaseModel):
    mrp: Optional[float] = None
    customer_price: Optional[float] = None
    distributor_price: Optional[float] = None
    bulk_price: Optional[float] = None
    bulk_moq: Optional[int] = None


# Role-specific product response
class ProductDynamicOut(BaseModel):
    id: int
    sku: str
    name: str
    subtitle: Optional[str] = None
    composition: str
    pack_size: str
    description: Optional[str] = None
    category: Optional[CategoryOut] = None
    category_name: Optional[str] = None
    
    # Dynamic pricing fields presented based on authenticated role
    mrp: float
    display_price: float
    role_price_label: str
    discount_percentage: float
    
    # Tax / GST fields
    gst_rate: float = 0.12
    hsn_code: str = "3004"
    
    # B2B specific fields (if Distributor or Admin)
    distributor_price: Optional[float] = None
    customer_price: Optional[float] = None
    bulk_price: Optional[float] = None
    bulk_moq: Optional[int] = None
    
    # Inventory info
    stock: int
    in_stock: bool
    batch_no: Optional[str] = None
    expiry_date: Optional[str] = None
    image: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class StockAdjustRequest(BaseModel):
    adjustment: int  # e.g., +50 or -20
    reason: str
    batch_no: Optional[str] = None
