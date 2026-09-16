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


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


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
    requested_credit_limit: Optional[float] = 500000.0
    business_address: Optional[str] = "Primary Depot Address"
    city: Optional[str] = "Hyderabad"
    state: Optional[str] = "Telangana"
    pincode: Optional[str] = "500001"


class RetailerRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    phone: str
    shop_name: str
    owner_name: str
    gstin: Optional[str] = None
    pan_no: Optional[str] = None
    drug_license_no: str
    form_20_no: Optional[str] = None
    form_21_no: Optional[str] = None
    dl_issue_date: Optional[str] = None
    dl_expiry_date: Optional[str] = None
    pharmacist_name: Optional[str] = None
    pharmacist_reg_no: Optional[str] = None
    drug_license_doc_url: Optional[str] = None
    pharmacist_cert_url: Optional[str] = None
    gst_doc_url: Optional[str] = None
    requested_credit_limit: Optional[float] = 100000.0
    shop_address: Optional[str] = "Registered Pharmacy Shop Address"
    city: Optional[str] = "Hyderabad"
    state: Optional[str] = "Telangana"
    pincode: Optional[str] = "500072"


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
    requested_credit_limit: Optional[float] = 0.0
    credit_limit: Optional[float] = 0.0


class UserRoleUpdateRequest(BaseModel):
    role: UserRole


class CreditLimitUpdateRequest(BaseModel):
    credit_limit: float


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
    requested_credit_limit: Optional[float] = 0.0
    credit_limit: Optional[float] = 0.0

    class Config:
        from_attributes = True


class RetailerProfileOut(BaseModel):
    shop_name: str
    owner_name: str
    gstin: Optional[str] = None
    pan_no: Optional[str] = None
    drug_license_no: str
    form_20_no: Optional[str] = None
    form_21_no: Optional[str] = None
    dl_issue_date: Optional[str] = None
    dl_expiry_date: Optional[str] = None
    pharmacist_name: Optional[str] = None
    pharmacist_reg_no: Optional[str] = None
    drug_license_doc_url: Optional[str] = None
    pharmacist_cert_url: Optional[str] = None
    gst_doc_url: Optional[str] = None
    shop_address: str
    city: str
    state: str
    pincode: str
    kyc_status: KYCStatus
    admin_remarks: Optional[str] = None
    requested_credit_limit: Optional[float] = 0.0
    credit_limit: Optional[float] = 0.0
    credit_terms_days: Optional[int] = 30

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    company_name: Optional[str] = None
    shop_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    requested_credit_limit: Optional[float] = None


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
    retailer_profile: Optional[RetailerProfileOut] = None
    lifetime_orders: Optional[int] = 0
    total_spent: Optional[float] = 0.0

    class Config:
        from_attributes = True


class AddressCreateRequest(BaseModel):
    address_type: str = "HOME"  # "HOME", "OFFICE", "CLINIC", "PHARMACY", "OTHER"
    recipient_name: str
    phone: str
    street_address: str
    city: str
    state: str
    pincode: str
    is_default: bool = False


class AddressUpdateRequest(BaseModel):
    address_type: Optional[str] = None
    recipient_name: Optional[str] = None
    phone: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    is_default: Optional[bool] = None


class AddressOut(BaseModel):
    id: int
    user_id: int
    address_type: str
    recipient_name: str
    phone: str
    street_address: str
    city: str
    state: str
    pincode: str
    is_default: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
