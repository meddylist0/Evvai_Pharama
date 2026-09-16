from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.user import KYCStatus


class KYCSubmissionRequest(BaseModel):
    gst_number: str
    drug_license_no: str
    pan_number: Optional[str] = None
    document_file_url: Optional[str] = None
    requested_credit_limit: Optional[float] = 0.0


class KYCReviewRequest(BaseModel):
    status: KYCStatus
    admin_remarks: Optional[str] = None
    credit_limit: Optional[float] = None


class KYCOut(BaseModel):
    id: int
    distributor_id: Optional[int] = None
    retailer_id: Optional[int] = None
    partner_type: str = "DISTRIBUTOR"  # "DISTRIBUTOR" or "RETAILER"
    company_name: Optional[str] = None
    distributor_name: Optional[str] = None
    shop_name: Optional[str] = None
    owner_name: Optional[str] = None
    pharmacist_name: Optional[str] = None
    pharmacist_reg_no: Optional[str] = None
    form_20_no: Optional[str] = None
    form_21_no: Optional[str] = None
    gst_number: Optional[str] = None
    drug_license_no: Optional[str] = None
    pan_number: Optional[str] = None
    document_file_url: Optional[str] = None
    verification_status: KYCStatus
    admin_remarks: Optional[str] = None
    requested_credit_limit: Optional[float] = 0.0
    credit_limit: Optional[float] = 0.0
    credit_terms_days: Optional[int] = None
    city: Optional[str] = None
    state: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

