from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_admin
from app.models.user import User
from app.schemas.order import OrderOut
from app.schemas.payment import (
    PaymentPublicConfigOut,
    RazorpayOrderCreateRequest,
    RazorpayOrderOut,
    RazorpayVerifyAndOrderRequest,
    PaymentAdminSettingsOut,
    PaymentAdminSettingsUpdateRequest
)
from app.services.payment_service import (
    get_or_create_payment_settings,
    create_razorpay_order_api,
    create_verified_paid_order
)
from app.services.audit_service import record_audit

router = APIRouter()

"""
DEVELOPER NOTE — MULTI-GATEWAY PAYMENT ENDPOINTS:
1. Signature Verification: verify_and_place_paid_order validates Razorpay HMAC-SHA256 signatures before stock allocation.
2. Replay & Idempotency: Replays are blocked using razorpay_payment_id in DB to reject duplicate attempts.
3. Security: Secret keys (Razorpay, Stripe, PayPal) are automatically masked in responses.
"""

@router.get("/config", response_model=PaymentPublicConfigOut)
def get_public_payment_config(
    db: Session = Depends(get_db)
):
    """
    Public Checkout Payment Gateway Config.
    
    DEVELOPER NOTES:
    - Public unauthenticated endpoint providing Gateway key_id and active payment methods (COD, Wire, Online)
      for frontend checkout initialization.
    """
    config = get_or_create_payment_settings(db)
    return PaymentPublicConfigOut(
        key_id=config.key_id,
        is_active=config.is_active,
        mode=config.mode,
        currency=config.currency or "INR",
        cod_enabled=config.cod_enabled,
        stripe_active=config.stripe_active or False,
        stripe_publishable_key=config.stripe_publishable_key or "",
        paypal_active=config.paypal_active or False,
        paypal_client_id=config.paypal_client_id or "",
        wire_enabled=config.wire_enabled if config.wire_enabled is not None else True
    )


@router.post("/create-razorpay-order", response_model=RazorpayOrderOut)
def create_razorpay_order(
    req: RazorpayOrderCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initiate Razorpay Gateway Checkout Order.
    
    DEVELOPER NOTES:
    - Authoritative amount calculation in paise (₹1 = 100 paise) executed on server side.
    - Creates order on Razorpay API using configured Key ID / Key Secret.
    """
    order_data = create_razorpay_order_api(
        db=db,
        current_user=current_user,
        order_create_req=req,
        notes=req.notes or {"user_id": str(current_user.id), "email": current_user.email}
    )
    return RazorpayOrderOut(**order_data)


@router.post("/verify-and-order", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def verify_and_place_paid_order(
    verify_req: RazorpayVerifyAndOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verify Razorpay HMAC Signature & Create Paid Order.
    
    DEVELOPER NOTES:
    - Verifies HMAC-SHA256 signature (razorpay_order_id|razorpay_payment_id).
    - Checks for duplicate payment_id replay attack.
    - On success: Executes FEFO stock deduction, persists Order, and logs audit trail in single transaction.
    """
    return create_verified_paid_order(
        db=db,
        verify_req=verify_req,
        current_user=current_user
    )


def mask_secret(secret: str) -> str:
    if not secret:
        return ""
    if len(secret) > 8:
        return f"{secret[:4]}****{secret[-4:]}"
    return "********"


@router.get("/admin/settings", response_model=PaymentAdminSettingsOut)
def get_payment_admin_settings(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Retrieve multi-gateway payment settings for administrator management."""
    config = get_or_create_payment_settings(db)
    
    return PaymentAdminSettingsOut(
        id=config.id,
        gateway_name=config.gateway_name,
        key_id=config.key_id,
        key_secret_masked=mask_secret(config.key_secret),
        is_active=config.is_active,
        mode=config.mode,
        currency=config.currency,
        cod_enabled=config.cod_enabled,
        auto_capture=config.auto_capture,

        # Multi-gateway fields
        stripe_active=config.stripe_active or False,
        stripe_mode=config.stripe_mode or "test",
        stripe_publishable_key=config.stripe_publishable_key or "",
        stripe_secret_masked=mask_secret(config.stripe_secret_key),

        paypal_active=config.paypal_active or False,
        paypal_mode=config.paypal_mode or "sandbox",
        paypal_client_id=config.paypal_client_id or "",
        paypal_secret_masked=mask_secret(config.paypal_secret),

        wire_enabled=config.wire_enabled if config.wire_enabled is not None else True,
        bank_name=config.bank_name or "HDFC Bank Ltd",
        account_no=config.account_no or "50200012345678",
        ifsc_code=config.ifsc_code or "HDFC0001234",

        updated_at=config.updated_at
    )


@router.put("/admin/settings", response_model=PaymentAdminSettingsOut)
def update_payment_admin_settings(
    update_req: PaymentAdminSettingsUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Update Razorpay, Stripe, PayPal, COD, and Wire transfer settings dynamically."""
    config = get_or_create_payment_settings(db)

    # Razorpay Updates
    if update_req.key_id is not None and update_req.key_id.strip():
        config.key_id = update_req.key_id.strip()

    if update_req.key_secret is not None and update_req.key_secret.strip() and not update_req.key_secret.startswith("****"):
        config.key_secret = update_req.key_secret.strip()

    if update_req.is_active is not None:
        config.is_active = update_req.is_active

    if update_req.mode is not None:
        config.mode = update_req.mode

    if update_req.currency is not None:
        config.currency = update_req.currency

    if update_req.cod_enabled is not None:
        config.cod_enabled = update_req.cod_enabled

    # Stripe Updates
    if update_req.stripe_active is not None:
        config.stripe_active = update_req.stripe_active
    if update_req.stripe_mode is not None:
        config.stripe_mode = update_req.stripe_mode
    if update_req.stripe_publishable_key is not None and update_req.stripe_publishable_key.strip():
        config.stripe_publishable_key = update_req.stripe_publishable_key.strip()
    if update_req.stripe_secret_key is not None and update_req.stripe_secret_key.strip() and not update_req.stripe_secret_key.startswith("****"):
        config.stripe_secret_key = update_req.stripe_secret_key.strip()

    # PayPal Updates
    if update_req.paypal_active is not None:
        config.paypal_active = update_req.paypal_active
    if update_req.paypal_mode is not None:
        config.paypal_mode = update_req.paypal_mode
    if update_req.paypal_client_id is not None and update_req.paypal_client_id.strip():
        config.paypal_client_id = update_req.paypal_client_id.strip()
    if update_req.paypal_secret is not None and update_req.paypal_secret.strip() and not update_req.paypal_secret.startswith("****"):
        config.paypal_secret = update_req.paypal_secret.strip()

    # Wire Transfer Updates
    if update_req.wire_enabled is not None:
        config.wire_enabled = update_req.wire_enabled
    if update_req.bank_name is not None and update_req.bank_name.strip():
        config.bank_name = update_req.bank_name.strip()
    if update_req.account_no is not None and update_req.account_no.strip():
        config.account_no = update_req.account_no.strip()
    if update_req.ifsc_code is not None and update_req.ifsc_code.strip():
        config.ifsc_code = update_req.ifsc_code.strip()

    db.commit()
    db.refresh(config)

    record_audit(
        db=db,
        action="PAYMENT_GATEWAY_CONFIG_UPDATED",
        module="PAYMENTS",
        details=f"Payment gateway configuration updated. Razorpay Active: {config.is_active}, Stripe Active: {config.stripe_active}, PayPal Active: {config.paypal_active}, COD: {config.cod_enabled}, Wire: {config.wire_enabled}",
        user=admin_user
    )

    return PaymentAdminSettingsOut(
        id=config.id,
        gateway_name=config.gateway_name,
        key_id=config.key_id,
        key_secret_masked=mask_secret(config.key_secret),
        is_active=config.is_active,
        mode=config.mode,
        currency=config.currency,
        cod_enabled=config.cod_enabled,
        auto_capture=config.auto_capture,

        stripe_active=config.stripe_active or False,
        stripe_mode=config.stripe_mode or "test",
        stripe_publishable_key=config.stripe_publishable_key or "",
        stripe_secret_masked=mask_secret(config.stripe_secret_key),

        paypal_active=config.paypal_active or False,
        paypal_mode=config.paypal_mode or "sandbox",
        paypal_client_id=config.paypal_client_id or "",
        paypal_secret_masked=mask_secret(config.paypal_secret),

        wire_enabled=config.wire_enabled if config.wire_enabled is not None else True,
        bank_name=config.bank_name or "HDFC Bank Ltd",
        account_no=config.account_no or "50200012345678",
        ifsc_code=config.ifsc_code or "HDFC0001234",

        updated_at=config.updated_at
    )
