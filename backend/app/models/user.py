import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    DISTRIBUTOR = "DISTRIBUTOR"
    RETAILER = "RETAILER"
    CUSTOMER = "CUSTOMER"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    avatar = Column(Text, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer_profile = relationship("CustomerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    distributor_profile = relationship("DistributorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    retailer_profile = relationship("RetailerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    addresses = relationship("UserAddress", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class UserAddress(Base):
    __tablename__ = "user_addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    address_type = Column(String(50), default="HOME", nullable=False)  # "HOME", "OFFICE", "CLINIC", "PHARMACY", "OTHER"
    recipient_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    street_address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(20), nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="addresses")


class CustomerProfile(Base):
    __tablename__ = "customer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="customer_profile")


class KYCStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class DistributorProfile(Base):
    __tablename__ = "distributor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    distributor_name = Column(String(255), nullable=False)
    gstin = Column(String(30), nullable=False)
    drug_license_no = Column(String(50), nullable=False)
    business_address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(20), nullable=False)
    kyc_status = Column(Enum(KYCStatus), default=KYCStatus.PENDING, nullable=False)
    admin_remarks = Column(Text, nullable=True)
    requested_credit_limit = Column(Float, default=0.0, nullable=False)
    credit_limit = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="distributor_profile")
    kyc_submissions = relationship("DistributorKYC", back_populates="distributor")


class RetailerProfile(Base):
    __tablename__ = "retailer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    shop_name = Column(String(255), nullable=False)
    owner_name = Column(String(255), nullable=False)
    gstin = Column(String(30), nullable=True)
    pan_no = Column(String(30), nullable=True)
    
    # Drug License & Form 20 / 21 Details
    drug_license_no = Column(String(50), nullable=False)
    form_20_no = Column(String(50), nullable=True)
    form_21_no = Column(String(50), nullable=True)
    dl_issue_date = Column(String(50), nullable=True)
    dl_expiry_date = Column(String(50), nullable=True)
    
    # Registered Pharmacist Details
    pharmacist_name = Column(String(255), nullable=True)
    pharmacist_reg_no = Column(String(100), nullable=True)
    
    # Document Upload URLs
    drug_license_doc_url = Column(Text, nullable=True)
    pharmacist_cert_url = Column(Text, nullable=True)
    gst_doc_url = Column(Text, nullable=True)

    # Address Details
    shop_address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(20), nullable=False)

    # Compliance & Credit Engine
    kyc_status = Column(Enum(KYCStatus), default=KYCStatus.PENDING, nullable=False)
    admin_remarks = Column(Text, nullable=True)
    requested_credit_limit = Column(Float, default=0.0, nullable=False)
    credit_limit = Column(Float, default=0.0, nullable=False)
    credit_terms_days = Column(Integer, default=30, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="retailer_profile")
