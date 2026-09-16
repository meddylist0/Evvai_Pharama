from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.permissions import require_admin
from app.models.user import User, UserRole, CustomerProfile, DistributorProfile, KYCStatus
from app.models.order import OrderStatus, PaymentStatus
from app.schemas.user import UserOut, UserCreateAdminRequest, UserRoleUpdateRequest, CreditLimitUpdateRequest
from app.services.audit_service import record_audit

router = APIRouter()


@router.get("", response_model=List[UserOut])
def list_users(
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            (User.email.ilike(s)) | (User.full_name.ilike(s))
        )
    
    users = query.order_by(User.created_at.desc()).all()
    results = []
    for u in users:
        # Calculate actual lifetime orders and total spent directly from SQLite database
        user_orders = u.orders if u.orders else []
        valid_orders = [o for o in user_orders if o.order_status != OrderStatus.CANCELLED]
        lifetime_orders = len(valid_orders)
        total_spent = sum(o.total_amount for o in valid_orders)

        user_out = UserOut.model_validate(u)
        user_out.lifetime_orders = lifetime_orders
        user_out.total_spent = round(float(total_spent), 2)
        results.append(user_out)
        
    return results


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_staff_user(
    req: UserCreateAdminRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    existing = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user account with this email already exists."
        )

    try:
        new_user = User(
            email=req.email.strip().lower(),
            hashed_password=get_password_hash(req.password),
            full_name=req.full_name.strip(),
            phone=req.phone,
            role=req.role,
            is_active=True,
            is_verified=True
        )
        db.add(new_user)
        db.flush()

        if req.role == UserRole.DISTRIBUTOR:
            dist_profile = DistributorProfile(
                user_id=new_user.id,
                company_name=req.company_name or f"{req.full_name} Enterprise",
                distributor_name=req.full_name,
                gstin="36AAACR9999F1Z0",
                drug_license_no="DL-HYD-ADMIN-CREATED",
                business_address=req.address or "Pharma Hub Distribution Center",
                city=req.city or "Hyderabad",
                state=req.state or "Telangana",
                pincode=req.pincode or "500081",
                kyc_status=KYCStatus.APPROVED,
                credit_limit=req.credit_limit if req.credit_limit is not None else 500000.0
            )
            db.add(dist_profile)
        else:
            cust_profile = CustomerProfile(
                user_id=new_user.id,
                address=req.address,
                city=req.city,
                state=req.state,
                pincode=req.pincode
            )
            db.add(cust_profile)

        record_audit(
            db=db,
            action="USER_CREATED_BY_ADMIN",
            module="USERS",
            details=f"Admin {admin_user.email} created new user {new_user.email} with role {new_user.role.value}",
            user=admin_user
        )

        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        raise

    user_out = UserOut.model_validate(new_user)
    user_out.lifetime_orders = 0
    user_out.total_spent = 0.0
    return user_out


@router.patch("/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    req: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_role = user.role.value
    user.role = req.role
    db.commit()
    db.refresh(user)

    record_audit(
        db=db,
        action="USER_ROLE_CHANGED",
        module="USERS",
        details=f"Admin {admin_user.email} updated role of {user.email} from {old_role} to {req.role.value}",
        user=admin_user
    )

    user_out = UserOut.model_validate(user)
    user_orders = user.orders if user.orders else []
    valid_orders = [o for o in user_orders if o.order_status != OrderStatus.CANCELLED]
    user_out.lifetime_orders = len(valid_orders)
    user_out.total_spent = round(float(sum(o.total_amount for o in valid_orders)), 2)
    return user_out


@router.patch("/{user_id}/credit-limit", response_model=UserOut)
def update_distributor_credit_limit(
    user_id: int,
    req: CreditLimitUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if req.credit_limit < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credit limit cannot be negative."
        )

    if user.distributor_profile:
        old_limit = user.distributor_profile.credit_limit or 0.0
        user.distributor_profile.credit_limit = float(req.credit_limit)
    elif user.retailer_profile:
        old_limit = user.retailer_profile.credit_limit or 0.0
        user.retailer_profile.credit_limit = float(req.credit_limit)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user does not have a distributor or retailer profile to assign a credit limit."
        )

    db.commit()
    db.refresh(user)

    record_audit(
        db=db,
        action="CREDIT_LIMIT_UPDATED",
        module="USERS",
        details=f"Admin {admin_user.email} updated B2B credit limit for {user.email} from ₹{old_limit:,.2f} to ₹{req.credit_limit:,.2f}",
        user=admin_user
    )

    user_out = UserOut.model_validate(user)
    user_orders = user.orders if user.orders else []
    valid_orders = [o for o in user_orders if o.order_status != OrderStatus.CANCELLED]
    user_out.lifetime_orders = len(valid_orders)
    user_out.total_spent = round(float(sum(o.total_amount for o in valid_orders)), 2)
    return user_out


@router.patch("/{user_id}/toggle-status", response_model=UserOut)
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == admin_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate own admin account.")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)

    status_str = "activated" if user.is_active else "deactivated"
    record_audit(
        db=db,
        action="USER_STATUS_TOGGLED",
        module="AUTH",
        details=f"User {user.email} was {status_str}",
        user=admin_user
    )

    user_out = UserOut.model_validate(user)
    user_orders = user.orders if user.orders else []
    valid_orders = [o for o in user_orders if o.order_status != OrderStatus.CANCELLED]
    user_out.lifetime_orders = len(valid_orders)
    user_out.total_spent = round(float(sum(o.total_amount for o in valid_orders)), 2)
    return user_out
