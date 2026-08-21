from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from app.models.user import UserRole, KYCStatus


class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    user_id: int
    full_name: str
    email: str
    kyc_status: Optional[str] = None
    avatar: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class CustomerRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class DistributorRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    phone: str
    company_name: str
    distributor_name: str
    gstin: str
    drug_license_no: str
    pan_number: Optional[str] = None
    document_file_url: Optional[str] = None
    business_address: str
    city: str
    state: str
    pincode: str



class UserCreateAdminRequest(BaseModel):
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER
    company_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class UserRoleUpdateRequest(BaseModel):
    role: UserRole


class CustomerProfileOut(BaseModel):
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    class Config:
        from_attributes = True


class DistributorProfileOut(BaseModel):
    company_name: str
    distributor_name: str
    gstin: str
    drug_license_no: str
    business_address: str
    city: str
    state: str
    pincode: str
    kyc_status: KYCStatus
    admin_remarks: Optional[str] = None

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    company_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    customer_profile: Optional[CustomerProfileOut] = None
    distributor_profile: Optional[DistributorProfileOut] = None
    lifetime_orders: Optional[int] = 0
    total_spent: Optional[float] = 0.0

    class Config:
        from_attributes = True
