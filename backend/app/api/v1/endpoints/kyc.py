from typing import List, Optional
from datetime import datetime
import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_admin, require_distributor
from app.models.user import User, UserRole, KYCStatus, DistributorProfile, RetailerProfile
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
    if req.requested_credit_limit and req.requested_credit_limit > 0:
        profile.requested_credit_limit = float(req.requested_credit_limit)

    submission = DistributorKYC(
        distributor_id=profile.id,
        gst_number=req.gst_number,
        drug_license_no=req.drug_license_no,
        pan_number=req.pan_number,
        document_file_url=doc_url,
        requested_credit_limit=float(req.requested_credit_limit or profile.requested_credit_limit or 0.0),
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
        partner_type="DISTRIBUTOR",
        company_name=profile.company_name,
        distributor_name=profile.distributor_name,
        gst_number=submission.gst_number,
        drug_license_no=submission.drug_license_no,
        pan_number=submission.pan_number,
        document_file_url=submission.document_file_url,
        verification_status=submission.verification_status,
        admin_remarks=submission.admin_remarks,
        requested_credit_limit=profile.requested_credit_limit or 0.0,
        credit_limit=profile.credit_limit or 0.0,
        city=profile.city,
        state=profile.state,
        phone=current_user.phone,
        email=current_user.email,
        submitted_at=submission.submitted_at,
        reviewed_at=submission.reviewed_at
    )


@router.get("/pending", response_model=List[KYCOut])
def list_pending_kyc(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """List all pending distributor and retailer KYC submissions."""
    results = []

    # 1. Fetch Distributor Submissions
    dist_submissions = db.query(DistributorKYC).join(DistributorProfile).order_by(DistributorKYC.submitted_at.desc()).all()
    for sub in dist_submissions:
        dist_user = sub.distributor.user if sub.distributor and sub.distributor.user else None
        results.append(
            KYCOut(
                id=sub.id,
                distributor_id=sub.distributor_id,
                partner_type="DISTRIBUTOR",
                company_name=sub.distributor.company_name if sub.distributor else "N/A",
                distributor_name=sub.distributor.distributor_name if sub.distributor else "N/A",
                gst_number=sub.gst_number,
                drug_license_no=sub.drug_license_no,
                pan_number=sub.pan_number,
                document_file_url=sub.document_file_url,
                verification_status=sub.verification_status,
                admin_remarks=sub.admin_remarks,
                requested_credit_limit=sub.requested_credit_limit or (sub.distributor.requested_credit_limit if sub.distributor else 0.0),
                credit_limit=sub.distributor.credit_limit if sub.distributor else 0.0,
                city=sub.distributor.city if sub.distributor else None,
                state=sub.distributor.state if sub.distributor else None,
                phone=dist_user.phone if dist_user else None,
                email=dist_user.email if dist_user else None,
                submitted_at=sub.submitted_at,
                reviewed_at=sub.reviewed_at
            )
        )

    # 2. Fetch Retailer Profiles with KYC status
    retailers = db.query(RetailerProfile).order_by(RetailerProfile.created_at.desc()).all()
    for ret in retailers:
        ret_user = ret.user if ret.user else None
        results.append(
            KYCOut(
                id=ret.id + 10000,  # Offset to ensure distinct numeric ID if needed
                retailer_id=ret.id,
                partner_type="RETAILER",
                company_name=ret.shop_name,
                distributor_name=ret.owner_name,
                shop_name=ret.shop_name,
                owner_name=ret.owner_name,
                pharmacist_name=ret.pharmacist_name,
                pharmacist_reg_no=ret.pharmacist_reg_no,
                form_20_no=ret.form_20_no or ret.drug_license_no,
                form_21_no=ret.form_21_no,
                gst_number=ret.gstin,
                drug_license_no=ret.drug_license_no,
                pan_number=ret.pan_no,
                document_file_url=ret.drug_license_doc_url or ret.pharmacist_cert_url,
                verification_status=ret.kyc_status,
                admin_remarks=ret.admin_remarks,
                requested_credit_limit=getattr(ret, 'requested_credit_limit', 0.0) or 0.0,
                credit_limit=ret.credit_limit or 0.0,
                credit_terms_days=ret.credit_terms_days,
                city=ret.city,
                state=ret.state,
                phone=ret_user.phone if ret_user else None,
                email=ret_user.email if ret_user else None,
                submitted_at=ret.created_at,
                reviewed_at=ret.updated_at
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
    """
    submission = db.query(DistributorKYC).filter(DistributorKYC.id == submission_id).first()
    if submission:
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
        return {
            "status": "authorized",
            "submission_id": submission.id,
            "distributor_id": submission.distributor_id,
            "document_url": submission.document_file_url,
            "access_granted_to": current_user.email,
            "role": current_user.role.value
        }

    # Check Retailer Profile if submission_id maps to retailer
    ret_id = submission_id if submission_id < 10000 else submission_id - 10000
    retailer = db.query(RetailerProfile).filter(RetailerProfile.id == ret_id).first()
    if retailer:
        is_admin = current_user.role == UserRole.ADMIN
        is_owner = (
            current_user.role == UserRole.RETAILER and
            current_user.retailer_profile is not None and
            current_user.retailer_profile.id == retailer.id
        )
        if not (is_admin or is_owner):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to view this private KYC document."
            )
        return {
            "status": "authorized",
            "submission_id": retailer.id,
            "retailer_id": retailer.id,
            "document_url": retailer.drug_license_doc_url or retailer.pharmacist_cert_url,
            "access_granted_to": current_user.email,
            "role": current_user.role.value
        }

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KYC record not found.")


@router.post("/retailer/{retailer_id}/review", response_model=KYCOut)
def review_retailer_kyc(
    retailer_id: int,
    review: KYCReviewRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    retailer = db.query(RetailerProfile).filter(RetailerProfile.id == retailer_id).first()
    if not retailer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer profile not found.")

    retailer.kyc_status = review.status
    retailer.admin_remarks = review.admin_remarks
    retailer.updated_at = datetime.utcnow()
    if review.credit_limit is not None and review.credit_limit >= 0:
        retailer.credit_limit = float(review.credit_limit)

    if review.status == KYCStatus.APPROVED and retailer.user:
        retailer.user.is_verified = True

    db.commit()
    db.refresh(retailer)

    record_audit(
        db=db,
        action="RETAILER_KYC_REVIEWED",
        module="KYC",
        details=f"Retailer KYC for '{retailer.shop_name}' (ID: {retailer.id}) reviewed: {review.status.value}. Remarks: {review.admin_remarks}",
        user=admin_user
    )

    ret_user = retailer.user
    return KYCOut(
        id=retailer.id + 10000,
        retailer_id=retailer.id,
        partner_type="RETAILER",
        company_name=retailer.shop_name,
        distributor_name=retailer.owner_name,
        shop_name=retailer.shop_name,
        owner_name=retailer.owner_name,
        pharmacist_name=retailer.pharmacist_name,
        pharmacist_reg_no=retailer.pharmacist_reg_no,
        form_20_no=retailer.form_20_no or retailer.drug_license_no,
        form_21_no=retailer.form_21_no,
        gst_number=retailer.gstin,
        drug_license_no=retailer.drug_license_no,
        pan_number=retailer.pan_no,
        document_file_url=retailer.drug_license_doc_url or retailer.pharmacist_cert_url,
        verification_status=retailer.kyc_status,
        admin_remarks=retailer.admin_remarks,
        requested_credit_limit=getattr(retailer, 'requested_credit_limit', 0.0) or 0.0,
        credit_limit=retailer.credit_limit or 0.0,
        credit_terms_days=retailer.credit_terms_days,
        city=retailer.city,
        state=retailer.state,
        phone=ret_user.phone if ret_user else None,
        email=ret_user.email if ret_user else None,
        submitted_at=retailer.created_at,
        reviewed_at=retailer.updated_at
    )


@router.post("/{submission_id}/review", response_model=KYCOut)
def review_kyc(
    submission_id: int,
    review: KYCReviewRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    submission = db.query(DistributorKYC).filter(DistributorKYC.id == submission_id).first()
    if not submission:
        # Check if this is a retailer ID or offset retailer ID
        ret_id = submission_id if submission_id < 10000 else submission_id - 10000
        retailer = db.query(RetailerProfile).filter(RetailerProfile.id == ret_id).first()
        if retailer:
            return review_retailer_kyc(ret_id, review, db, admin_user)
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
        if review.status == KYCStatus.APPROVED and submission.distributor.user:
            submission.distributor.user.is_verified = True

    db.commit()
    db.refresh(submission)

    record_audit(
        db=db,
        action="KYC_REVIEWED",
        module="KYC",
        details=f"Distributor KYC Submission {submission_id} reviewed: {review.status.value}. Remarks: {review.admin_remarks}",
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
    except Exception:
        pass

    dist_user = submission.distributor.user if submission.distributor else None
    return KYCOut(
        id=submission.id,
        distributor_id=submission.distributor_id,
        partner_type="DISTRIBUTOR",
        company_name=submission.distributor.company_name if submission.distributor else "N/A",
        distributor_name=submission.distributor.distributor_name if submission.distributor else "N/A",
        gst_number=submission.gst_number,
        drug_license_no=submission.drug_license_no,
        pan_number=submission.pan_number,
        document_file_url=submission.document_file_url,
        verification_status=submission.verification_status,
        admin_remarks=submission.admin_remarks,
        requested_credit_limit=submission.requested_credit_limit or (submission.distributor.requested_credit_limit if submission.distributor else 0.0),
        credit_limit=submission.distributor.credit_limit if submission.distributor else 0.0,
        city=submission.distributor.city if submission.distributor else None,
        state=submission.distributor.state if submission.distributor else None,
        phone=dist_user.phone if dist_user else None,
        email=dist_user.email if dist_user else None,
        submitted_at=submission.submitted_at,
        reviewed_at=submission.reviewed_at
    )

