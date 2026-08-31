from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.user import KYCStatus


class KYCSubmissionRequest(BaseModel):
    gst_number: str
    drug_license_no: str
    pan_number: Optional[str] = None
    document_file_url: Optional[str] = None


class KYCReviewRequest(BaseModel):
    status: KYCStatus
    admin_remarks: Optional[str] = None
    credit_limit: Optional[float] = None


class KYCOut(BaseModel):
    id: int
    distributor_id: int
    company_name: Optional[str] = None
    distributor_name: Optional[str] = None
    gst_number: str
    drug_license_no: str
    pan_number: Optional[str] = None
    document_file_url: Optional[str] = None
    verification_status: KYCStatus
    admin_remarks: Optional[str] = None
    credit_limit: Optional[float] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
