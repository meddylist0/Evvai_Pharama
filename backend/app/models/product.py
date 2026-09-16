from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    image = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    subtitle = Column(String(255), nullable=True)
    composition = Column(String(255), nullable=False)
    pack_size = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    # Role-Based Pricing Structure
    mrp = Column(Float, nullable=False)
    customer_price = Column(Float, nullable=False)
    distributor_price = Column(Float, nullable=False)
    bulk_price = Column(Float, nullable=False)
    bulk_moq = Column(Integer, default=50, nullable=False)
    
    # Tax / GST Structure
    gst_rate = Column(Float, default=0.12, nullable=False)
    hsn_code = Column(String(50), default="3004", nullable=False)
    
    # Inventory & Batch details
    stock = Column(Integer, default=0, nullable=False)
    reserved_stock = Column(Integer, default=0, nullable=False)
    low_stock_threshold = Column(Integer, default=100, nullable=False)
    batch_no = Column(String(100), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    
    # Media & Status
    image = Column(Text, nullable=True)
    status = Column(String(20), default="active", nullable=False)  # active, disabled

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    batches = relationship("ProductBatch", back_populates="product", cascade="all, delete-orphan", order_by="ProductBatch.expiry_date_val.asc()")
    transactions = relationship("InventoryTransaction", back_populates="product", cascade="all, delete-orphan", order_by="InventoryTransaction.created_at.desc()")


class ProductBatch(Base):
    __tablename__ = "product_batches"
    __table_args__ = (
        UniqueConstraint("product_id", "batch_no", name="uq_product_batch_no"),
    )

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    batch_no = Column(String(100), nullable=False, index=True)
    mfg_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=False)  # Display string e.g. "12/2028"
    expiry_date_val = Column(DateTime, nullable=True, index=True)  # Proper DB date for FEFO sorting & queries
    quantity = Column(Integer, default=0, nullable=False)  # Active available quantity in this batch
    reserved_quantity = Column(Integer, default=0, nullable=False)
    purchase_rate = Column(Float, nullable=True)
    warehouse = Column(String(100), default="Main Warehouse", nullable=False)
    storage_location = Column(String(100), default="Cleanroom A", nullable=False)
    status = Column(String(20), default="active", nullable=False)  # active, quarantine, expired, depleted

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="batches")
    transactions = relationship("InventoryTransaction", back_populates="batch")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("product_batches.id"), nullable=True, index=True)
    transaction_type = Column(String(50), nullable=False)  # RECEIPT, SALE, ADJUSTMENT_ADD, ADJUSTMENT_DEDUCT, DAMAGE, RETURN
    quantity = Column(Integer, nullable=False)  # Signed (+ inward, - outward)
    balance_after = Column(Integer, nullable=False)  # Stock balance after transaction
    reason = Column(String(255), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    product = relationship("Product", back_populates="transactions")
    batch = relationship("ProductBatch", back_populates="transactions")

