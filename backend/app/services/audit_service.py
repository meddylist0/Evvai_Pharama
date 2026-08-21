import re
from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.models.user import User


def sanitize_audit_details(details: Optional[str]) -> Optional[str]:
    if not details:
        return details
    
    sanitized = details
    # Redact passwords, JWT bearer tokens, PAN numbers, Razorpay secrets
    sanitized = re.sub(r'(?i)password["\']?\s*[:=]\s*["\']?[^\s,"\'&]+', 'password=[REDACTED]', sanitized)
    sanitized = re.sub(r'Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*', 'Bearer [REDACTED_TOKEN]', sanitized)
    sanitized = re.sub(r'[A-Z]{5}[0-9]{4}[A-Z]{1}', '[REDACTED_PAN]', sanitized)
    sanitized = re.sub(r'(?i)secret["\']?\s*[:=]\s*["\']?[^\s,"\'&]+', 'secret=[REDACTED]', sanitized)
    return sanitized


def record_audit(
    db: Session,
    action: str,
    module: str,
    details: Optional[str] = None,
    user: Optional[User] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    clean_details = sanitize_audit_details(details)
    log_entry = AuditLog(
        user_id=user.id if user else None,
        action=action,
        module=module,
        details=clean_details,
        ip_address=ip_address
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry

