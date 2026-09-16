from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.permissions import get_current_user
from app.core.rate_limiter import login_rate_limiter
from app.models.user import User, UserRole, CustomerProfile, DistributorProfile, RetailerProfile, KYCStatus
from app.models.kyc import DistributorKYC
from app.schemas.user import (
    Token,
    LoginRequest,
    PasswordChangeRequest,
    CustomerRegisterRequest,
    DistributorRegisterRequest,
    RetailerRegisterRequest,
    ProfileUpdateRequest,
    UserOut
)
from app.services.audit_service import record_audit

router = APIRouter()

"""
DEVELOPER NOTE — AUTHENTICATION & USER PROFILE ENDPOINTS:
1. Rate Limiting: Login attempts are rate-limited via login_rate_limiter (5 failures per 60s per IP/Email).
2. Registration: Retail customers & Retailers get auto-activated; Distributors require Admin KYC verification.
3. Tokens: Returns JWT access tokens with user role & ID claims.
"""


@router.post("/login", response_model=Token)
def login(login_req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    User Login Endpoint with Rate Limiting & Audit Logging.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # Check rate limiter before processing
    login_rate_limiter.check_rate_limit(client_ip, login_req.email)

    user = db.query(User).filter(User.email == login_req.email.strip().lower()).first()
    if not user or not verify_password(login_req.password, user.hashed_password):
        login_rate_limiter.record_failure(client_ip, login_req.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        login_rate_limiter.record_failure(client_ip, login_req.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Clear rate limiter on successful authentication
    login_rate_limiter.record_success(client_ip, login_req.email)

    kyc_status_str = None
    if user.distributor_profile:
        kyc_status_str = user.distributor_profile.kyc_status.value
    elif user.retailer_profile:
        kyc_status_str = user.retailer_profile.kyc_status.value

    access_token = create_access_token(subject=user.id, role=user.role.value)
    
    record_audit(
        db=db,
        action="USER_LOGIN",
        module="AUTH",
        details=f"User {user.email} logged in with role {user.role.value}",
        user=user
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "kyc_status": kyc_status_str,
        "avatar": user.avatar
    }


@router.post("/register-customer", response_model=Token)
def register_customer(req: CustomerRegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    try:
        user = User(
            email=req.email.strip().lower(),
            hashed_password=get_password_hash(req.password),
            full_name=req.full_name.strip(),
            phone=req.phone,
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.flush()

        profile = CustomerProfile(
            user_id=user.id,
            address=req.address,
            city=req.city,
            state=req.state,
            pincode=req.pincode
        )
        db.add(profile)

        record_audit(
            db=db,
            action="CUSTOMER_REGISTER",
            module="AUTH",
            details=f"New retail customer registered: {user.email}",
            user=user
        )

        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    access_token = create_access_token(subject=user.id, role=user.role.value)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "kyc_status": None,
        "avatar": user.avatar
    }


@router.post("/register-retailer", response_model=Token)
def register_retailer(req: RetailerRegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    try:
        user = User(
            email=req.email.strip().lower(),
            hashed_password=get_password_hash(req.password),
            full_name=req.full_name.strip(),
            phone=req.phone,
            role=UserRole.RETAILER,
            is_active=True,
            is_verified=False
        )
        db.add(user)
        db.flush()

        profile = RetailerProfile(
            user_id=user.id,
            shop_name=req.shop_name.strip(),
            owner_name=req.owner_name.strip(),
            gstin=req.gstin.strip() if req.gstin else None,
            pan_no=req.pan_no.strip() if req.pan_no else None,
            drug_license_no=req.drug_license_no.strip(),
            form_20_no=req.form_20_no.strip() if req.form_20_no else req.drug_license_no.strip(),
            form_21_no=req.form_21_no.strip() if req.form_21_no else None,
            dl_issue_date=req.dl_issue_date,
            dl_expiry_date=req.dl_expiry_date,
            pharmacist_name=req.pharmacist_name,
            pharmacist_reg_no=req.pharmacist_reg_no,
            drug_license_doc_url=req.drug_license_doc_url,
            pharmacist_cert_url=req.pharmacist_cert_url,
            gst_doc_url=req.gst_doc_url,
            shop_address=req.shop_address or "Registered Pharmacy Address",
            city=req.city or "Hyderabad",
            state=req.state or "Telangana",
            pincode=req.pincode or "500072",
            kyc_status=KYCStatus.PENDING,
            requested_credit_limit=float(req.requested_credit_limit or 100000.0),
            credit_limit=0.0,
            credit_terms_days=30
        )
        db.add(profile)

        record_audit(
            db=db,
            action="RETAILER_REGISTER",
            module="AUTH",
            details=f"New pharmacy retailer registered: {req.shop_name} ({user.email}) with DL {req.drug_license_no}",
            user=user
        )

        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    access_token = create_access_token(subject=user.id, role=user.role.value)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "kyc_status": KYCStatus.PENDING.value,
        "avatar": user.avatar
    }


@router.post("/register-distributor", response_model=Token)
def register_distributor(req: DistributorRegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    try:
        user = User(
            email=req.email.strip().lower(),
            hashed_password=get_password_hash(req.password),
            full_name=req.full_name.strip(),
            phone=req.phone.strip(),
            role=UserRole.DISTRIBUTOR,
            is_active=True,
            is_verified=False
        )
        db.add(user)
        db.flush()

        req_limit = float(req.requested_credit_limit or 500000.0)
        profile = DistributorProfile(
            user_id=user.id,
            company_name=req.company_name.strip(),
            distributor_name=req.distributor_name.strip(),
            gstin=req.gstin.strip(),
            drug_license_no=req.drug_license_no.strip(),
            business_address=req.business_address,
            city=req.city,
            state=req.state,
            pincode=req.pincode,
            kyc_status=KYCStatus.PENDING,
            requested_credit_limit=req_limit,
            credit_limit=0.0
        )
        db.add(profile)
        db.flush()

        # Immediately create KYC submission for Admin review
        kyc_sub = DistributorKYC(
            distributor_id=profile.id,
            gst_number=req.gstin.strip(),
            drug_license_no=req.drug_license_no.strip(),
            pan_number=req.pan_number,
            document_file_url=req.document_file_url,
            requested_credit_limit=req_limit,
            verification_status=KYCStatus.PENDING
        )
        db.add(kyc_sub)

        record_audit(
            db=db,
            action="DISTRIBUTOR_REGISTER",
            module="AUTH",
            details=f"New distributor registered: {req.company_name} ({user.email})",
            user=user
        )

        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    access_token = create_access_token(subject=user.id, role=user.role.value)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "kyc_status": KYCStatus.PENDING.value,
        "avatar": user.avatar
    }


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserOut)
def update_profile(
    req: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if req.email is not None:
        new_email = req.email.strip().lower()
        if new_email and new_email != current_user.email:
            existing = db.query(User).filter(User.email == new_email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This email address is already in use by another account."
                )
            current_user.email = new_email
    if req.full_name is not None:
        current_user.full_name = req.full_name.strip()
    if req.phone is not None:
        current_user.phone = req.phone.strip()
    if req.avatar is not None:
        current_user.avatar = req.avatar

    if current_user.retailer_profile:
        if req.shop_name is not None:
            current_user.retailer_profile.shop_name = req.shop_name.strip()
        if req.address is not None:
            current_user.retailer_profile.shop_address = req.address
        if req.city is not None:
            current_user.retailer_profile.city = req.city
        if req.state is not None:
            current_user.retailer_profile.state = req.state
        if req.pincode is not None:
            current_user.retailer_profile.pincode = req.pincode
        if req.requested_credit_limit is not None and req.requested_credit_limit >= 0:
            current_user.retailer_profile.requested_credit_limit = float(req.requested_credit_limit)
    elif current_user.distributor_profile:
        if req.company_name is not None:
            current_user.distributor_profile.company_name = req.company_name.strip()
        if req.address is not None:
            current_user.distributor_profile.business_address = req.address
        if req.city is not None:
            current_user.distributor_profile.city = req.city
        if req.state is not None:
            current_user.distributor_profile.state = req.state
        if req.pincode is not None:
            current_user.distributor_profile.pincode = req.pincode
        if req.requested_credit_limit is not None and req.requested_credit_limit >= 0:
            current_user.distributor_profile.requested_credit_limit = float(req.requested_credit_limit)
    elif current_user.customer_profile:
        if req.address is not None:
            current_user.customer_profile.address = req.address
        if req.city is not None:
            current_user.customer_profile.city = req.city
        if req.state is not None:
            current_user.customer_profile.state = req.state
        if req.pincode is not None:
            current_user.customer_profile.pincode = req.pincode

    db.commit()
    db.refresh(current_user)

    record_audit(
        db=db,
        action="PROFILE_UPDATED",
        module="AUTH",
        details=f"User {current_user.email} updated their profile details",
        user=current_user
    )

    return current_user


@router.post("/change-password")
def change_password(
    req: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect. Please check and try again."
        )
    
    if len(req.new_password.strip()) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )
    
    if req.current_password == req.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be identical to your current password."
        )

    current_user.hashed_password = get_password_hash(req.new_password.strip())
    db.commit()

    record_audit(
        db=db,
        action="PASSWORD_CHANGED",
        module="AUTH",
        details=f"User {current_user.email} changed their password",
        user=current_user
    )

    return {"status": "success", "message": "Password changed successfully"}


@router.get("/me/credit-status")
def get_my_credit_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns real-time trade credit limit, outstanding unpaid orders balance,
    available credit balance, and credit terms for Retailers and Distributors.
    """
    from app.models.order import Order, OrderStatus, PaymentStatus
    
    if current_user.role == UserRole.RETAILER:
        credit_limit = current_user.retailer_profile.credit_limit if current_user.retailer_profile else 100000.0
        credit_terms_days = getattr(current_user.retailer_profile, 'credit_terms_days', 30) if current_user.retailer_profile else 30
        kyc_status = current_user.retailer_profile.kyc_status.value if current_user.retailer_profile else "PENDING"
    elif current_user.role == UserRole.DISTRIBUTOR:
        credit_limit = current_user.distributor_profile.credit_limit if current_user.distributor_profile else 500000.0
        credit_terms_days = 30
        kyc_status = current_user.distributor_profile.kyc_status.value if current_user.distributor_profile else "PENDING"
    else:
        return {
            "credit_limit": 0.0,
            "outstanding_amount": 0.0,
            "available_credit": 0.0,
            "credit_terms_days": 0,
            "kyc_status": "N/A"
        }

    # Calculate sum of unpaid pending orders
    unpaid_orders = (
        db.query(Order)
        .filter(
            Order.user_id == current_user.id,
            Order.payment_status == PaymentStatus.PENDING,
            Order.order_status != OrderStatus.CANCELLED
        )
        .all()
    )
    outstanding_amount = round(sum(o.total_amount for o in unpaid_orders), 2)
    available_credit = max(0.0, round(credit_limit - outstanding_amount, 2))

    return {
        "credit_limit": credit_limit,
        "outstanding_amount": outstanding_amount,
        "available_credit": available_credit,
        "credit_terms_days": credit_terms_days,
        "kyc_status": kyc_status,
        "unpaid_orders_count": len(unpaid_orders)
    }
