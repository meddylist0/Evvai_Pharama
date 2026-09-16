from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.inquiry import ContactInquiry
from app.services.audit_service import record_audit

router = APIRouter()

# Pydantic Schemas
class InquiryCreate(BaseModel):
    name: str
    email: str
    phone: str
    company: Optional[str] = None
    subject: str
    message: str

class InquiryUpdate(BaseModel):
    status: Optional[str] = None
    admin_notes: Optional[str] = None

class InquiryOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    company: Optional[str] = None
    subject: str
    message: str
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=InquiryOut, status_code=status.HTTP_201_CREATED)
def submit_contact_inquiry(payload: InquiryCreate, db: Session = Depends(get_db)):
    """Public endpoint: Submit a commercial contact inquiry."""
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if not payload.email.strip():
        raise HTTPException(status_code=400, detail="Email is required")
    if not payload.phone.strip():
        raise HTTPException(status_code=400, detail="Phone is required")
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")

    inquiry = ContactInquiry(
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        phone=payload.phone.strip(),
        company=payload.company.strip() if payload.company else None,
        subject=payload.subject.strip(),
        message=payload.message.strip(),
        status="NEW"
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)

    # Record Audit Log for Lead Generation
    try:
        record_audit(
            db=db,
            action="NEW_COMMERCIAL_LEAD_SUBMITTED",
            module="LEADS",
            details=f"New B2B Lead #{inquiry.id} '{payload.name}' ({payload.email}, {payload.phone}) submitted inquiry: '{payload.subject}' (Company: {payload.company or 'N/A'})"
        )
    except Exception as e:
        print(f"Warning: Audit log failed for inquiry #{inquiry.id}: {e}")

    return inquiry

@router.get("/", response_model=List[InquiryOut])
def list_contact_inquiries(
    search: Optional[str] = Query(None, description="Search by name, email, company or subject"),
    status: Optional[str] = Query(None, description="Filter by status (NEW, IN_PROGRESS, RESPONDED, ARCHIVED)"),
    db: Session = Depends(get_db)
):
    """Admin endpoint: Get all commercial inquiries."""
    query = db.query(ContactInquiry)
    
    if status and status.upper() != "ALL":
        query = query.filter(ContactInquiry.status == status.upper())
        
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (ContactInquiry.name.ilike(search_term)) |
            (ContactInquiry.email.ilike(search_term)) |
            (ContactInquiry.company.ilike(search_term)) |
            (ContactInquiry.subject.ilike(search_term)) |
            (ContactInquiry.phone.ilike(search_term))
        )
        
    return query.order_by(ContactInquiry.id.desc()).all()

@router.patch("/{inquiry_id}", response_model=InquiryOut)
def update_contact_inquiry(inquiry_id: int, payload: InquiryUpdate, db: Session = Depends(get_db)):
    """Admin endpoint: Update inquiry status or admin notes."""
    inquiry = db.query(ContactInquiry).filter(ContactInquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    old_status = inquiry.status
    if payload.status is not None:
        inquiry.status = payload.status.upper()
    if payload.admin_notes is not None:
        inquiry.admin_notes = payload.admin_notes.strip()

    db.commit()
    db.refresh(inquiry)

    # Record Audit Log for Lead Status Update
    try:
        record_audit(
            db=db,
            action="LEAD_STATUS_UPDATED",
            module="LEADS",
            details=f"Lead #{inquiry.id} ({inquiry.name}) status updated from {old_status} to {inquiry.status}"
        )
    except Exception as e:
        print(f"Warning: Audit log failed for updating inquiry #{inquiry.id}: {e}")

    return inquiry

@router.delete("/{inquiry_id}")
def delete_contact_inquiry(inquiry_id: int, db: Session = Depends(get_db)):
    """Admin endpoint: Delete an inquiry."""
    inquiry = db.query(ContactInquiry).filter(ContactInquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    inquiry_name = inquiry.name
    db.delete(inquiry)
    db.commit()

    # Record Audit Log for Lead Deletion
    try:
        record_audit(
            db=db,
            action="LEAD_DELETED",
            module="LEADS",
            details=f"Lead #{inquiry_id} ({inquiry_name}) deleted by admin"
        )
    except Exception as e:
        print(f"Warning: Audit log failed for deleting inquiry #{inquiry_id}: {e}")

    return {"message": f"Inquiry #{inquiry_id} deleted successfully"}
