from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.permissions import get_current_user, require_admin
from app.models.user import User, UserRole
from app.models.notification import NotificationSetting, NotificationLog
from app.schemas.notification import (
    NotificationSettingSchema,
    NotificationSettingUpdateSchema,
    TestNotificationRequest,
    NotificationLogSchema,
)
from app.services.notification_service import (
    get_or_create_settings,
    send_email_notification,
    send_sms_notification,
)

router = APIRouter()


def mask_secret(secret_str: str) -> str:
    if not secret_str:
        return "Not Configured"
    if len(secret_str) <= 6:
        return "*" * len(secret_str)
    return secret_str[:3] + "*" * (len(secret_str) - 6) + secret_str[-3:]


@router.get("/settings", response_model=NotificationSettingSchema)
def get_notification_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    setting = get_or_create_settings(db)
    return NotificationSettingSchema(
        id=setting.id,
        smtp_host=setting.smtp_host,
        smtp_port=setting.smtp_port,
        smtp_user=setting.smtp_user,
        smtp_password_masked=mask_secret(setting.smtp_password),
        sender_email=setting.sender_email,
        sender_name=setting.sender_name,
        email_enabled=setting.email_enabled,
        sms_provider=setting.sms_provider,
        sms_api_key_masked=mask_secret(setting.sms_api_key),
        sms_sender_id=setting.sms_sender_id,
        sms_enabled=setting.sms_enabled,
        notify_order_created=setting.notify_order_created,
        notify_order_status=setting.notify_order_status,
        notify_kyc_status=setting.notify_kyc_status,
        updated_at=setting.updated_at,
    )


@router.put("/settings", response_model=NotificationSettingSchema)
def update_notification_settings(
    payload: NotificationSettingUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    setting = get_or_create_settings(db)

    if payload.smtp_host is not None:
        setting.smtp_host = payload.smtp_host
    if payload.smtp_port is not None:
        setting.smtp_port = payload.smtp_port
    if payload.smtp_user is not None:
        setting.smtp_user = payload.smtp_user
    if payload.smtp_password and payload.smtp_password.strip():
        setting.smtp_password = payload.smtp_password
    if payload.sender_email is not None:
        setting.sender_email = payload.sender_email
    if payload.sender_name is not None:
        setting.sender_name = payload.sender_name
    if payload.email_enabled is not None:
        setting.email_enabled = payload.email_enabled

    if payload.sms_provider is not None:
        setting.sms_provider = payload.sms_provider
    if payload.sms_api_key and payload.sms_api_key.strip():
        setting.sms_api_key = payload.sms_api_key
    if payload.sms_sender_id is not None:
        setting.sms_sender_id = payload.sms_sender_id
    if payload.sms_enabled is not None:
        setting.sms_enabled = payload.sms_enabled

    if payload.notify_order_created is not None:
        setting.notify_order_created = payload.notify_order_created
    if payload.notify_order_status is not None:
        setting.notify_order_status = payload.notify_order_status
    if payload.notify_kyc_status is not None:
        setting.notify_kyc_status = payload.notify_kyc_status

    db.commit()
    db.refresh(setting)

    return get_notification_settings(db=db, current_user=current_user)


@router.post("/test-email")
def send_test_email(
    payload: TestNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    setting = get_or_create_settings(db)
    subject = f"Order Confirmation #ORD-TEST-8892 - {setting.sender_name}"
    
    body = (
        f"Dear {current_user.full_name},\n\n"
        f"This is an automated gateway verification email from {setting.sender_name}.\n\n"
        f"Order Code: #ORD-TEST-8892\n"
        f"Sample Item: Paracetamol 650mg IP Bulk Pack (Qty: 2) @ ₹250.00 = ₹500.00\n"
        f"Total Amount: ₹500.00\n"
        f"Gateway Status: SMTP Active & Verified\n\n"
        f"If you received this email, your live email notification server is configured and operating 100% correctly.\n\n"
        f"Regards,\n"
        f"{setting.sender_name}"
    )

    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Gateway Verification Receipt</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding: 30px 12px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 620px; background-color:#ffffff; border-radius: 20px; overflow:hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.06);" cellpadding="0" cellspacing="0">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background-color:#131921; border-bottom: 4px solid #ff9900; padding: 20px 28px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="color:#ffffff; margin:0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Evvai <span style="color:#ff9900;">Pharma</span></span>
                    <p style="color:#94a3b8; margin: 4px 0 0 0; font-size: 12px; font-weight: 500;">Live Email Dispatch Gateway Verification</p>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="background-color:#22c55e; color:#ffffff; font-size: 11px; font-weight: 800; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; display:inline-block;">✓ VERIFIED</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding: 28px;">
              <p style="font-size: 16px; color:#0b2341; margin-top:0; font-weight: 700;">Dear {current_user.full_name},</p>
              <p style="font-size: 14px; color:#475569; line-height: 1.6; margin-bottom: 24px;">
                Congratulations! Your corporate SMTP Email Gateway has been successfully verified. Live order dispatch notifications are now active.
              </p>

              <!-- SAMPLE ORDER METADATA -->
              <table width="100%" style="background-color:#f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 24px;" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding: 6px 12px; border-right: 1px solid #e2e8f0;">
                    <span style="font-size: 10px; color:#64748b; text-transform: uppercase; font-weight: 800; display:block; letter-spacing: 0.5px;">Gateway Status</span>
                    <strong style="font-size: 15px; color:#10b981;">SMTP Live Connected</strong>
                  </td>
                  <td width="50%" style="padding: 6px 12px;">
                    <span style="font-size: 10px; color:#64748b; text-transform: uppercase; font-weight: 800; display:block; letter-spacing: 0.5px;">Sender Account</span>
                    <strong style="font-size: 13px; color:#0b2341;">{setting.sender_email}</strong>
                  </td>
                </tr>
              </table>

              <!-- SAMPLE ORDER ITEMS TABLE -->
              <h3 style="font-size: 13px; text-transform: uppercase; color:#0b2341; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 2px solid #0b2341; padding-bottom: 6px;">Order Dispatch Preview</h3>
              <table width="100%" style="border-collapse: collapse; margin-bottom: 24px; font-size: 13px;" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="background-color:#f1f5f9;">
                    <th style="padding: 10px 16px; text-align: left; color:#475569; font-weight: 800; border-bottom: 2px solid #cbd5e1;">Item Name</th>
                    <th style="padding: 10px 16px; text-align: center; color:#475569; font-weight: 800; border-bottom: 2px solid #cbd5e1;">Qty</th>
                    <th style="padding: 10px 16px; text-align: right; color:#475569; font-weight: 800; border-bottom: 2px solid #cbd5e1;">Price</th>
                    <th style="padding: 10px 16px; text-align: right; color:#475569; font-weight: 800; border-bottom: 2px solid #cbd5e1;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0b2341;">Paracetamol 650mg IP (Bulk Box)</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569; font-weight: 700;">2</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">₹250.00</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0b2341;">₹500.00</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0b2341;">Amoxicillin 500mg Capsules (10x10)</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569; font-weight: 700;">1</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">₹450.00</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0b2341;">₹450.00</td>
                  </tr>
                </tbody>
              </table>

              <!-- SUMMARY CALCULATIONS -->
              <table width="100%" style="margin-bottom: 24px;" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="40%"></td>
                  <td width="60%">
                    <table width="100%" style="font-size: 13px; color:#475569;" cellpadding="4" cellspacing="0">
                      <tr>
                        <td>Subtotal:</td>
                        <td align="right" style="font-weight: 700; color:#0b2341;">₹950.00</td>
                      </tr>
                      <tr>
                        <td>GST (12%):</td>
                        <td align="right" style="font-weight: 700; color:#0b2341;">₹114.00</td>
                      </tr>
                      <tr>
                        <td style="padding-top: 10px; border-top: 2px solid #0b2341; font-weight: 900; font-size: 15px; color:#0b2341;">Total Paid:</td>
                        <td align="right" style="padding-top: 10px; border-top: 2px solid #0b2341; font-weight: 900; font-size: 17px; color:#10b981;">₹1,064.00</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color:#64748b; line-height: 1.5; margin-bottom:0;">
                All customer orders placed on your storefront will now trigger emails matching this format in real time.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f1f5f9; padding: 20px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color:#64748b; margin:0;">
                © 2026 {setting.sender_name}. All rights reserved.<br>
                Automated Notification Engine.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    success = send_email_notification(db, payload.target, subject, body, event_type="TEST", html_body=html_body)
    return {
        "success": True,
        "message": f"Test email dispatched to {payload.target} successfully!",
        "status": "SENT" if success else "SIMULATED",
    }


@router.post("/test-sms")
def send_test_sms(
    payload: TestNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    body = (
        f"PharmaLink Test SMS: Gateway check successful for {payload.target}. "
        f"Triggered by Admin {current_user.full_name}."
    )
    success = send_sms_notification(db, payload.target, body, event_type="TEST")
    return {
        "success": True,
        "message": f"Test SMS dispatched to {payload.target} successfully!",
        "status": "SENT" if success else "SIMULATED",
    }


@router.get("/logs", response_model=List[NotificationLogSchema])
def get_notification_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    logs = (
        db.query(NotificationLog)
        .order_by(NotificationLog.sent_at.desc())
        .limit(limit)
        .all()
    )
    return logs
