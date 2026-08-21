from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
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
