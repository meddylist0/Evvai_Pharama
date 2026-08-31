from typing import List, Optional
from datetime import datetime
import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_admin, require_distributor
from app.models.user import User, UserRole, KYCStatus, DistributorProfile
from app.models.kyc import DistributorKYC
from app.schemas.kyc import (
    KYCSubmissionRequest,
    KYCReviewRequest,
    KYCOut
)
from app.services.audit_service import record_audit

router = APIRouter()


@router.post("/submit", response_model=KYCOut)
def submit_kyc(
    req: KYCSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_distributor)
):
    profile = current_user.distributor_profile
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated distributor profile."
        )

    # Sanitize document URL / path
    doc_url = req.document_file_url or ""
    if any(p in doc_url for p in ["..", "\\", "\x00", "%2e%2e"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or prohibited filename characters detected."
        )

    # Update profile fields
    profile.gstin = req.gst_number
    profile.drug_license_no = req.drug_license_no
    profile.kyc_status = KYCStatus.PENDING

    submission = DistributorKYC(
        distributor_id=profile.id,
        gst_number=req.gst_number,
        drug_license_no=req.drug_license_no,
        pan_number=req.pan_number,
        document_file_url=doc_url,
        verification_status=KYCStatus.PENDING
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    record_audit(
        db=db,
        action="KYC_SUBMITTED",
        module="KYC",
        details=f"Distributor '{profile.company_name}' submitted KYC documents",
        user=current_user
    )

    return KYCOut(
        id=submission.id,
        distributor_id=profile.id,
        company_name=profile.company_name,
        distributor_name=profile.distributor_name,
        gst_number=submission.gst_number,
        drug_license_no=submission.drug_license_no,
        pan_number=submission.pan_number,
        document_file_url=submission.document_file_url,
        verification_status=submission.verification_status,
        admin_remarks=submission.admin_remarks,
        submitted_at=submission.submitted_at,
        reviewed_at=submission.reviewed_at
    )


@router.get("/pending", response_model=List[KYCOut])
def list_pending_kyc(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    submissions = db.query(DistributorKYC).join(DistributorProfile).order_by(DistributorKYC.submitted_at.desc()).all()
    results = []
    for sub in submissions:
        results.append(
            KYCOut(
                id=sub.id,
                distributor_id=sub.distributor_id,
                company_name=sub.distributor.company_name if sub.distributor else "N/A",
                distributor_name=sub.distributor.distributor_name if sub.distributor else "N/A",
                gst_number=sub.gst_number,
                drug_license_no=sub.drug_license_no,
                pan_number=sub.pan_number,
                document_file_url=sub.document_file_url,
                verification_status=sub.verification_status,
                admin_remarks=sub.admin_remarks,
                credit_limit=sub.distributor.credit_limit if sub.distributor else 500000.0,
                submitted_at=sub.submitted_at,
                reviewed_at=sub.reviewed_at
            )
        )
    return results


@router.get("/{submission_id}/document")
def get_kyc_document(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Authenticated Private Document Retrieval Endpoint:
    Enforces strict access control: ONLY the document owner or an ADMIN can download/view private KYC documents.
    Prevents cross-user IDOR access and public static exposure.
    """
    submission = db.query(DistributorKYC).filter(DistributorKYC.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KYC submission not found.")

    # Authorization check: Admin or document owner only
    is_admin = current_user.role == UserRole.ADMIN
    is_owner = (
        current_user.role == UserRole.DISTRIBUTOR and
        current_user.distributor_profile is not None and
        current_user.distributor_profile.id == submission.distributor_id
    )

    if not (is_admin or is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to view this private KYC document."
        )

    doc_path = submission.document_file_url or ""
    # Path traversal validation
    if any(p in doc_path for p in ["..", "\\", "\x00", "%2e%2e"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prohibited filename pattern detected.")

    return {
        "status": "authorized",
        "submission_id": submission.id,
        "distributor_id": submission.distributor_id,
        "document_url": submission.document_file_url,
        "access_granted_to": current_user.email,
        "role": current_user.role.value
    }


@router.post("/{submission_id}/review", response_model=KYCOut)
def review_kyc(
    submission_id: int,
    review: KYCReviewRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    submission = db.query(DistributorKYC).filter(DistributorKYC.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KYC submission not found.")

    submission.verification_status = review.status
    submission.admin_remarks = review.admin_remarks
    submission.reviewed_at = datetime.utcnow()
    submission.verified_by_user_id = admin_user.id

    if submission.distributor:
        submission.distributor.kyc_status = review.status
        submission.distributor.admin_remarks = review.admin_remarks
        if review.credit_limit is not None and review.credit_limit >= 0:
            submission.distributor.credit_limit = float(review.credit_limit)
        if review.status == KYCStatus.APPROVED:
            submission.distributor.user.is_verified = True

    db.commit()
    db.refresh(submission)

    record_audit(
        db=db,
        action="KYC_REVIEWED",
        module="KYC",
        details=f"KYC Submission {submission_id} reviewed: {review.status.value}. Remarks: {review.admin_remarks}",
        user=admin_user
    )

    try:
        if submission.distributor and submission.distributor.user:
            from app.services.notification_service import notify_kyc_status_update
            notify_kyc_status_update(
                db=db,
                user=submission.distributor.user,
                status=review.status.value,
                comments=review.admin_remarks
            )
    except Exception as e:
        pass

    return KYCOut(
        id=submission.id,
        distributor_id=submission.distributor_id,
        company_name=submission.distributor.company_name if submission.distributor else "N/A",
        distributor_name=submission.distributor.distributor_name if submission.distributor else "N/A",
        gst_number=submission.gst_number,
        drug_license_no=submission.drug_license_no,
        pan_number=submission.pan_number,
        document_file_url=submission.document_file_url,
        verification_status=submission.verification_status,
        admin_remarks=submission.admin_remarks,
        submitted_at=submission.submitted_at,
        reviewed_at=submission.reviewed_at
    )
