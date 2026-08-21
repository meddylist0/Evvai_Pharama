from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
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

    # Update profile fields
    profile.gstin = req.gst_number
    profile.drug_license_no = req.drug_license_no
    profile.kyc_status = KYCStatus.PENDING

    submission = DistributorKYC(
        distributor_id=profile.id,
        gst_number=req.gst_number,
        drug_license_no=req.drug_license_no,
        pan_number=req.pan_number,
        document_file_url=req.document_file_url,
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
                submitted_at=sub.submitted_at,
                reviewed_at=sub.reviewed_at
            )
        )
    return results


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
