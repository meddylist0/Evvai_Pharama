from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.claim import ClaimType, ClaimStatus, ClaimResolutionType


class ClaimCreateRequest(BaseModel):
    order_id: int
    product_id: Optional[int] = None
    product_name: str
    batch_no: Optional[str] = None
    quantity: int
    claim_type: ClaimType = ClaimType.DAMAGED_GOODS
    reason_description: str
    supporting_doc_url: Optional[str] = None


class ClaimReviewRequest(BaseModel):
    status: ClaimStatus
    resolution_type: Optional[ClaimResolutionType] = ClaimResolutionType.CREDIT_NOTE
    credit_note_number: Optional[str] = None
    credit_amount: Optional[float] = None
    admin_remarks: Optional[str] = None


class ClaimOut(BaseModel):
    id: int
    claim_code: str
    order_id: int
    retailer_id: int
    product_id: Optional[int] = None
    product_name: str
    batch_no: Optional[str] = None
    quantity: int
    claim_type: ClaimType
    reason_description: str
    supporting_doc_url: Optional[str] = None
    status: ClaimStatus
    resolution_type: Optional[ClaimResolutionType] = None
    credit_note_number: Optional[str] = None
    credit_amount: Optional[float] = None
    admin_remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
