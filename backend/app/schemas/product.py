from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator, model_validator


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


class BatchBase(BaseModel):
    batch_no: str
    expiry_date: str
    mfg_date: Optional[str] = None
    quantity: int = 0
    purchase_rate: Optional[float] = None
    warehouse: str = "Main Warehouse"
    storage_location: str = "Cleanroom A"
    status: str = "active"


class BatchCreate(BatchBase):
    product_id: Optional[int] = None


class BatchOut(BatchBase):
    id: int
    product_id: int
    reserved_quantity: int = 0
    available_quantity: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @model_validator(mode="after")
    def compute_available(self):
        self.available_quantity = max(0, self.quantity - (self.reserved_quantity or 0))
        return self


class OpeningInventoryCreate(BaseModel):
    batch_no: str
    expiry_date: str
    mfg_date: Optional[str] = None
    quantity: int
    purchase_rate: Optional[float] = None
    warehouse: str = "Main Warehouse"
    storage_location: str = "Cleanroom A"

    @field_validator("quantity")
    def validate_qty(cls, v):
        if v <= 0:
            raise ValueError("Opening stock quantity must be greater than 0.")
        return v


class InventoryTransactionOut(BaseModel):
    id: int
    product_id: int
    batch_id: Optional[int] = None
    transaction_type: str
    quantity: int
    balance_after: int
    reason: Optional[str] = None
    user_id: Optional[int] = None
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
    low_stock_threshold: int = 100
    image: Optional[str] = None
    status: str = "active"

    @field_validator("mrp")
    def validate_mrp(cls, v):
        if v <= 0:
            raise ValueError("MRP must be greater than 0.")
        return v

    @field_validator("customer_price", "distributor_price", "bulk_price")
    def validate_prices(cls, v):
        if v < 0:
            raise ValueError("Selling price cannot be negative.")
        return v

    @model_validator(mode="after")
    def validate_pricing_hierarchy(self):
        if self.mrp and self.mrp > 0:
            if self.customer_price > self.mrp:
                raise ValueError(f"Customer price (₹{self.customer_price}) cannot exceed MRP (₹{self.mrp}).")
            if self.distributor_price > self.mrp:
                raise ValueError(f"Distributor price (₹{self.distributor_price}) cannot exceed MRP (₹{self.mrp}).")
            if self.bulk_price > self.mrp:
                raise ValueError(f"Bulk price (₹{self.bulk_price}) cannot exceed MRP (₹{self.mrp}).")
        return self


class ProductCreate(ProductBase):
    # Optional opening inventory object OR legacy parameters for backwards compatibility
    opening_inventory: Optional[OpeningInventoryCreate] = None
    stock: Optional[int] = 0
    batch_no: Optional[str] = None
    expiry_date: Optional[str] = None


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
    low_stock_threshold: Optional[int] = None
    image: Optional[str] = None
    status: Optional[str] = None

    # CRITICAL: stock, batch_no, and expiry_date are EXCLUDED from ProductUpdate.
    # Inventory changes MUST go through batch receipt, stock adjustment, or FEFO endpoints.

    @model_validator(mode="after")
    def validate_pricing_hierarchy_update(self):
        if self.mrp is not None and self.mrp <= 0:
            raise ValueError("MRP must be greater than 0.")
        if self.customer_price is not None and self.mrp is not None and self.customer_price > self.mrp:
            raise ValueError(f"Customer price (₹{self.customer_price}) cannot exceed MRP (₹{self.mrp}).")
        if self.distributor_price is not None and self.mrp is not None and self.distributor_price > self.mrp:
            raise ValueError(f"Distributor price (₹{self.distributor_price}) cannot exceed MRP (₹{self.mrp}).")
        return self



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
    batches: Optional[List[BatchOut]] = None
    image: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class StockAdjustRequest(BaseModel):
    adjustment: int  # e.g., +50 or -20
    reason: str
    batch_no: Optional[str] = None
