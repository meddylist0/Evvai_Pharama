from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole, KYCStatus

security_bearer = HTTPBearer(auto_error=False)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def _get_token_string(
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    oauth_token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[str]:
    if bearer and bearer.credentials:
        return bearer.credentials
    return oauth_token


def get_current_user_optional(
    token: Optional[str] = Depends(_get_token_string),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            return None
        user_id = int(payload["sub"])
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            return None
        return user
    except Exception:
        return None


def get_current_user(
    token: Optional[str] = Depends(_get_token_string),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    
    try:
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            raise credentials_exception
        user_id = int(payload["sub"])
    except (ValueError, TypeError, KeyError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise credentials_exception
    
    return user


def require_roles(allowed_roles: List[UserRole]):
    """FastAPI dependency factory enforcing that the authenticated user possesses one of the allowed roles."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {[r.value if hasattr(r, 'value') else r for r in allowed_roles]}"
            )
        return current_user
    return role_checker


def check_distributor_kyc_approved(user: User) -> bool:
    """Returns True if user is ADMIN or an APPROVED distributor, False otherwise."""
    if user.role == UserRole.ADMIN:
        return True
    if user.role != UserRole.DISTRIBUTOR:
        return False
    if not user.distributor_profile:
        return False
    return user.distributor_profile.kyc_status == KYCStatus.APPROVED


def require_approved_distributor(current_user: User = Depends(get_current_user)) -> User:
    """Enforces that the user is an authenticated distributor with APPROVED KYC status."""
    if current_user.role != UserRole.DISTRIBUTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: requires DISTRIBUTOR role."
        )
    if not current_user.distributor_profile or current_user.distributor_profile.kyc_status != KYCStatus.APPROVED:
        kyc_state = current_user.distributor_profile.kyc_status.value if current_user.distributor_profile else "MISSING"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Distributor KYC approval required. Current status: {kyc_state}"
        )
    return current_user


# Convenient shorthands
require_admin = require_roles([UserRole.ADMIN])
require_distributor = require_roles([UserRole.DISTRIBUTOR])
require_customer = require_roles([UserRole.CUSTOMER])
require_distributor_or_admin = require_roles([UserRole.DISTRIBUTOR, UserRole.ADMIN])
require_any_authenticated = require_roles([UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.CUSTOMER])


