from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_admin
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.report import AuditLogOut

router = APIRouter()


@router.get("", response_model=List[AuditLogOut])
def get_audit_logs(
    module: Optional[str] = Query(None, description="Filter by module (AUTH, PRODUCTS, ORDERS, KYC, PRICING)"),
    search: Optional[str] = Query(None, description="Search details or action"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    query = db.query(AuditLog)
    if module:
        query = query.filter(AuditLog.module == module.upper())
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (AuditLog.action.ilike(search_pattern)) |
            (AuditLog.details.ilike(search_pattern))
        )
    
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    out = []
    for l in logs:
        out.append(
            AuditLogOut(
                id=l.id,
                user_id=l.user_id,
                user_email=l.user.email if l.user else None,
                action=l.action,
                module=l.module,
                details=l.details,
                ip_address=l.ip_address,
                timestamp=l.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            )
        )
    return out
