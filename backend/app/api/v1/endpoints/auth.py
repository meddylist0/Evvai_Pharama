from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.permissions import get_current_user
from app.core.rate_limiter import login_rate_limiter
from app.models.user import User, UserRole, CustomerProfile, DistributorProfile, KYCStatus
from app.models.kyc import DistributorKYC
from app.schemas.user import (
    Token,
    LoginRequest,
    CustomerRegisterRequest,
    DistributorRegisterRequest,
    ProfileUpdateRequest,
    UserOut
)
from app.services.audit_service import record_audit

router = APIRouter()


@router.post("/login", response_model=Token)
def login(login_req: LoginRequest, request: Request, db: Session = Depends(get_db)):
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
            phone=req.phone,
            role=UserRole.DISTRIBUTOR,
            is_active=True,
            is_verified=False
        )
        db.add(user)
        db.flush()

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
            kyc_status=KYCStatus.PENDING
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
    if req.full_name is not None:
        current_user.full_name = req.full_name.strip()
    if req.phone is not None:
        current_user.phone = req.phone.strip()
    if req.avatar is not None:
        current_user.avatar = req.avatar

    if current_user.distributor_profile:
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

