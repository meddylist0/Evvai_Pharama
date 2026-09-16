import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class ClaimType(str, enum.Enum):
    DAMAGED_GOODS = "DAMAGED_GOODS"
    WRONG_PRODUCT = "WRONG_PRODUCT"
    SHORT_QUANTITY = "SHORT_QUANTITY"
    TRANSIT_DAMAGE = "TRANSIT_DAMAGE"
    NEAR_EXPIRY = "NEAR_EXPIRY"
    OTHER = "OTHER"


class ClaimStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SETTLED = "SETTLED"


class ClaimResolutionType(str, enum.Enum):
    CREDIT_NOTE = "CREDIT_NOTE"
    REPLACEMENT = "REPLACEMENT"
    REFUND = "REFUND"


class RetailerClaim(Base):
    __tablename__ = "retailer_claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., CLM-2026-0001
    
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    retailer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    
    product_name = Column(String(255), nullable=False)
    batch_no = Column(String(100), nullable=True)
    quantity = Column(Integer, nullable=False)
    
    claim_type = Column(Enum(ClaimType), default=ClaimType.DAMAGED_GOODS, nullable=False)
    reason_description = Column(Text, nullable=False)
    supporting_doc_url = Column(Text, nullable=True)
    
    status = Column(Enum(ClaimStatus), default=ClaimStatus.PENDING, nullable=False)
    resolution_type = Column(Enum(ClaimResolutionType), nullable=True)
    credit_note_number = Column(String(100), nullable=True)
    credit_amount = Column(Float, nullable=True)
    admin_remarks = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    order = relationship("Order")
    retailer = relationship("User")
    product = relationship("Product")
