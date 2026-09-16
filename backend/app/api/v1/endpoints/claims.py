from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_admin, require_retailer_or_admin
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus
from app.models.claim import RetailerClaim, ClaimType, ClaimStatus, ClaimResolutionType
from app.schemas.claim import ClaimCreateRequest, ClaimReviewRequest, ClaimOut
from app.services.audit_service import record_audit
import logging
import random

logger = logging.getLogger("pharmalink.claims")

router = APIRouter()


def generate_claim_code() -> str:
    timestamp = datetime.utcnow().strftime("%y%m%d")
    unique_suffix = f"{int(datetime.utcnow().timestamp() * 1000) % 100000:05d}-{random.randint(100, 999)}"
    return f"CLM-{timestamp}-{unique_suffix}"


def generate_credit_note_no() -> str:
    timestamp = datetime.utcnow().strftime("%Y%m")
    unique_suffix = f"{int(datetime.utcnow().timestamp() * 1000) % 100000:05d}"
    return f"CN-EVV-{timestamp}-{unique_suffix}"


@router.post("", response_model=ClaimOut, status_code=status.HTTP_201_CREATED)
def create_retailer_claim(
    claim_in: ClaimCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retailers raise a return/damage/shortage/near-expiry claim against a fulfilled or delivered order.
    """
    if current_user.role not in [UserRole.RETAILER, UserRole.DISTRIBUTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only verified commercial buyers can raise claims."
        )

    # Validate order ownership
    order = db.query(Order).filter(Order.id == claim_in.order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referenced order not found.")

    if current_user.role != UserRole.ADMIN and order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot raise claim against another account's order.")

    claim_code = generate_claim_code()

    new_claim = RetailerClaim(
        claim_code=claim_code,
        order_id=order.id,
        retailer_id=current_user.id,
        product_id=claim_in.product_id,
        product_name=claim_in.product_name,
        batch_no=claim_in.batch_no,
        quantity=claim_in.quantity,
        claim_type=claim_in.claim_type,
        reason_description=claim_in.reason_description,
        supporting_doc_url=claim_in.supporting_doc_url,
        status=ClaimStatus.PENDING
    )

    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)

    record_audit(
        db=db,
        action="CLAIM_SUBMITTED",
        module="CLAIMS",
        details=f"Retailer claim {claim_code} ({claim_in.claim_type.value}) submitted for Order {order.order_code}",
        user=current_user
    )

    return new_claim


@router.get("/my-claims", response_model=List[ClaimOut])
def get_my_claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all claims submitted by the currently logged-in retailer."""
    claims = (
        db.query(RetailerClaim)
        .filter(RetailerClaim.retailer_id == current_user.id)
        .order_by(RetailerClaim.created_at.desc())
        .all()
    )
    return claims


@router.get("", response_model=List[ClaimOut])
def list_all_claims(
    status_filter: Optional[str] = Query(None, description="Filter by status: PENDING, APPROVED, REJECTED, SETTLED"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin endpoint to view and audit all retailer return/breakage claims across the platform."""
    query = db.query(RetailerClaim).order_by(RetailerClaim.created_at.desc())
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(RetailerClaim.status == status_filter.upper())
    return query.all()


@router.post("/{claim_id}/review", response_model=ClaimOut)
def review_retailer_claim(
    claim_id: int,
    review_in: ClaimReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin reviews and resolves a retailer return/damage claim.
    If APPROVED/SETTLED with CREDIT_NOTE, automatically generates a credit note number.
    """
    claim = db.query(RetailerClaim).filter(RetailerClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim record not found.")

    claim.status = review_in.status
    claim.resolution_type = review_in.resolution_type
    claim.admin_remarks = review_in.admin_remarks
    claim.credit_amount = review_in.credit_amount

    if review_in.status in [ClaimStatus.APPROVED, ClaimStatus.SETTLED]:
        if not claim.credit_note_number and review_in.resolution_type == ClaimResolutionType.CREDIT_NOTE:
            claim.credit_note_number = review_in.credit_note_number or generate_credit_note_no()

    claim.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(claim)

    record_audit(
        db=db,
        action="CLAIM_REVIEWED",
        module="CLAIMS",
        details=f"Claim {claim.claim_code} updated to {claim.status.value} with resolution {claim.resolution_type}",
        user=current_user
    )

    return claim
