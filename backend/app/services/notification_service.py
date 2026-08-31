import smtplib
import json
import urllib.request
import urllib.parse
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import NotificationSetting, NotificationLog
from app.models.order import Order
from app.models.user import User
from app.core.config import settings as app_settings

logger = logging.getLogger("pharmalink.notifications")


def get_or_create_settings(db: Session) -> NotificationSetting:
    setting = db.query(NotificationSetting).first()
    if not setting:
        setting = NotificationSetting(
            smtp_host=getattr(app_settings, "SMTP_HOST", "smtp.gmail.com"),
            smtp_port=getattr(app_settings, "SMTP_PORT", 587),
            smtp_user=getattr(app_settings, "SMTP_USER", "notifications@evvaipharma.com"),
            smtp_password=getattr(app_settings, "SMTP_PASSWORD", "app_password_secret"),
            sender_email=getattr(app_settings, "SENDER_EMAIL", "orders@evvaipharma.com"),
            sender_name=getattr(app_settings, "SENDER_NAME", "Evvai Pharma"),
            email_enabled=getattr(app_settings, "EMAIL_ENABLED", True),
            sms_provider=getattr(app_settings, "SMS_PROVIDER", "Twilio / Fast2SMS"),
            sms_api_key=getattr(app_settings, "SMS_API_KEY", "SK_TEST_SMS_9988776655"),
            sms_sender_id=getattr(app_settings, "SMS_SENDER_ID", "EVVAI"),
            sms_enabled=getattr(app_settings, "SMS_ENABLED", True),
            notify_order_created=True,
            notify_order_status=True,
            notify_kyc_status=True,
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    else:
        # Dynamically upgrade brand name to Evvai Pharma if defaulted to old name
        if "PharmaLink" in (setting.sender_name or ""):
            setting.sender_name = "Evvai Pharma"
            if "pharmalink" in (setting.sender_email or ""):
                setting.sender_email = "orders@evvaipharma.com"
            db.commit()
            db.refresh(setting)
    return setting


def send_email_notification(
    db: Session,
    to_email: str,
    subject: str,
    body_text: str,
    event_type: str = "NOTIFICATION",
    html_body: Optional[str] = None,
) -> bool:
    settings = get_or_create_settings(db)
    
    if not settings.email_enabled:
        logger.info(f"Email notifications disabled. Skipping email to {to_email}")
        return False

    status = "SIMULATED"
    clean_pwd = settings.smtp_password.replace(" ", "").strip() if settings.smtp_password else ""
    error_detail = None

    # Attempt SMTP send if real settings provided, else fall back to clean simulated log
    try:
        if settings.smtp_user and clean_pwd and "app_password" not in clean_pwd and "secret" not in clean_pwd:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.sender_name} <{settings.sender_email or settings.smtp_user}>"
            msg["To"] = to_email
            msg.attach(MIMEText(body_text, "plain", "utf-8"))
            if html_body:
                msg.attach(MIMEText(html_body, "html", "utf-8"))

            port = int(settings.smtp_port or 587)
            if port == 465:
                # SSL Direct Connection
                server = smtplib.SMTP_SSL(settings.smtp_host, port, timeout=12)
            else:
                # Standard STARTTLS Connection (587, 25, 2525)
                server = smtplib.SMTP(settings.smtp_host, port, timeout=12)
                server.ehlo()
                server.starttls()
                server.ehlo()

            server.login(settings.smtp_user, clean_pwd)
            server.sendmail(settings.sender_email or settings.smtp_user, [to_email], msg.as_string())
            server.quit()
            status = "SENT"
            logger.info(f"Successfully sent live email to {to_email} for event {event_type}")
        else:
            status = "SIMULATED"
    except Exception as e:
        error_detail = str(e)
        logger.warning(f"SMTP Dispatch failed ({e}). Defaulting to SIMULATED dispatch record.")
        status = "SIMULATED"

    # Save log to DB
    log_entry = NotificationLog(
        recipient=to_email,
        channel="EMAIL",
        event_type=event_type,
        status=status,
        subject=subject,
        message_body=body_text
    )
    db.add(log_entry)
    db.commit()
    return status == "SENT"


def _dispatch_sms_http(provider: str, api_key: str, sender_id: str, to_phone: str, message: str) -> bool:
    """
    HTTP Dispatcher supporting Fast2SMS, Twilio, and Generic REST APIs.
    Returns True if successfully sent over HTTP, False if failed.
    """
    try:
        clean_phone = "".join(c for c in to_phone if c.isdigit())
        if provider and "fast2sms" in provider.lower():
            # Fast2SMS Quick Send / BulkV2 API (India DLT)
            url = "https://www.fast2sms.com/dev/bulkV2"
            payload = json.dumps({
                "route": "v3",
                "sender_id": sender_id or "TXTIND",
                "message": message,
                "language": "english",
                "flash": 0,
                "numbers": clean_phone
            }).encode('utf-8')
            req = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "authorization": api_key,
                    "Content-Type": "application/json"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                res_body = json.loads(response.read().decode('utf-8'))
                if res_body.get("return") is True or res_body.get("status_code") == 200:
                    logger.info(f"Fast2SMS SMS sent successfully to {clean_phone}")
                    return True
                logger.warning(f"Fast2SMS API returned non-success response: {res_body}")
                return False

        elif provider and "twilio" in provider.lower():
            # Twilio REST API
            parts = api_key.split(":")
            if len(parts) == 2:
                account_sid, auth_token = parts[0], parts[1]
            else:
                account_sid = "AC_TWILIO_ACCOUNT_SID"
                auth_token = api_key

            url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
            data = urllib.parse.urlencode({
                "From": sender_id or "+1234567890",
                "To": to_phone if to_phone.startswith("+") else f"+{to_phone}",
                "Body": message
            }).encode('utf-8')

            req = urllib.request.Request(url, data=data, method="POST")
            auth_str = f"{account_sid}:{auth_token}"
            encoded_auth = base64.b64encode(auth_str.encode('ascii')).decode('ascii')
            req.add_header("Authorization", f"Basic {encoded_auth}")
            req.add_header("Content-Type", "application/x-www-form-urlencoded")

            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status in (200, 201):
                    logger.info(f"Twilio SMS sent successfully to {to_phone}")
                    return True
                return False
    except Exception as e:
        logger.warning(f"SMS Live HTTP Dispatch failed ({e}). Defaulting to SIMULATED dispatch record.")
        return False

    return False


def send_sms_notification(
    db: Session,
    to_phone: str,
    message_body: str,
    event_type: str = "NOTIFICATION"
) -> bool:
    settings = get_or_create_settings(db)

    if not settings.sms_enabled:
        logger.info(f"SMS notifications disabled. Skipping SMS to {to_phone}")
        return False

    status = "SIMULATED"
    # Attempt HTTP send if real API key supplied, else simulate safely
    if settings.sms_api_key and "SK_TEST" not in settings.sms_api_key and "placeholder" not in settings.sms_api_key:
        sent_live = _dispatch_sms_http(
            provider=settings.sms_provider,
            api_key=settings.sms_api_key,
            sender_id=settings.sms_sender_id,
            to_phone=to_phone,
            message=message_body
        )
        status = "SENT" if sent_live else "SIMULATED"
    else:
        status = "SIMULATED"

    log_entry = NotificationLog(
        recipient=to_phone,
        channel="SMS",
        event_type=event_type,
        status=status,
        subject=None,
        message_body=message_body
    )
    db.add(log_entry)
    db.commit()
    return status == "SENT"



def generate_order_created_html(order: Order, user: User, sender_name: str) -> str:
    items_rows = ""
    if hasattr(order, "items") and order.items:
        for item in order.items:
            items_rows += f"""
            <tr>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
                <strong style="color: #0f1111; font-size: 14px; display: block;">{item.product_name}</strong>
                <span style="font-size: 11px; color: #565959;">SKU: {getattr(item, 'sku', 'N/A')}</span>
              </td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #0f1111; font-weight: 700; vertical-align: top;">{item.quantity}</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #333333; vertical-align: top;">₹{item.unit_price:,.2f}</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 700; color: #0f1111; vertical-align: top;">₹{item.total_price:,.2f}</td>
            </tr>
            """
    else:
        items_rows = """
        <tr>
          <td colspan="4" style="padding: 16px; border-bottom: 1px solid #e5e7eb; color: #565959; text-align: center;">Order Items Confirmed</td>
        </tr>
        """

    delivery_addr = ""
    if hasattr(order, "delivery_address") and order.delivery_address:
        parts = [order.delivery_address, getattr(order, 'delivery_city', ''), getattr(order, 'delivery_state', ''), getattr(order, 'delivery_pincode', '')]
        delivery_addr = ", ".join([p for p in parts if p])

    subtotal_val = getattr(order, 'subtotal', order.total_amount)
    tax_val = getattr(order, 'tax_amount', 0.0)
    shipping_val = getattr(order, 'shipping_charge', 0.0)

    gst_row = f"<tr><td align='left'>GST Tax:</td><td align='right'>₹{tax_val:,.2f}</td></tr>" if tax_val > 0 else ""
    shipping_row = f"<tr><td align='left'>Shipping:</td><td align='right'>₹{shipping_val:,.2f}</td></tr>" if shipping_val > 0 else "<tr><td align='left'>Shipping:</td><td align='right' style='color:#16a34a; font-weight:bold;'>FREE</td></tr>"

    brand_display = sender_name if sender_name and "Evvai" in sender_name else "Evvai Pharma"

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation #{order.order_code} - {brand_display}</title>
</head>
<body style="margin:0; padding:0; background-color:#eaeded; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f1111;">
  <!-- AMAZON TOP HEADER -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#131921; border-bottom: 4px solid #ff9900; padding: 14px 24px;">
    <tr>
      <td align="left">
        <span style="color:#ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Evvai <span style="color:#ff9900;">Pharma</span></span>
      </td>
      <td align="right" style="color:#e2e8f0; font-size: 13px; font-weight: 600;">
        Official Order Confirmation
      </td>
    </tr>
  </table>

  <!-- MAIN CONTAINER -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eaeded; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 640px; background-color:#ffffff; border-radius: 8px; overflow:hidden; border: 1px solid #d5d9d9; box-shadow: 0 4px 14px rgba(0,0,0,0.06);" cellpadding="0" cellspacing="0">
          
          <!-- HERO BANNER -->
          <tr>
            <td style="padding: 24px 28px 16px 28px;">
              <h2 style="font-size: 20px; color:#0f1111; margin:0 0 8px 0; font-weight: 700;">Hello {user.full_name},</h2>
              <p style="font-size: 14px; color:#333333; line-height: 1.5; margin:0 0 16px 0;">
                Thank you for shopping with <strong>{brand_display}</strong>! Your order has been placed successfully and is being prepared for dispatch.
              </p>
              
              <!-- CONFIRMATION STATUS BADGE -->
              <div style="background-color:#f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 14px 18px; margin-bottom: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <span style="color:#15803d; font-weight: 800; font-size: 15px;">✓ Order Placed & Confirmed</span>
                      <span style="color:#4b5563; font-size: 13px; display: block; margin-top: 3px;">Order Reference Code: <strong style="color:#0f1111;">#{order.order_code}</strong></span>
                    </td>
                    <td align="right">
                      <span style="background-color:#22c55e; color:#ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 12px; text-transform: uppercase;">CONFIRMED</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- ORDER DETAILS GRID -->
          <tr>
            <td style="padding: 0 28px 20px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e7e7e7; border-radius: 6px; background-color: #fafafa;">
                <tr>
                  <!-- DISPATCH & DELIVERY INFO -->
                  <td width="50%" style="padding: 16px; vertical-align: top; border-right: 1px solid #e7e7e7;">
                    <span style="font-size: 11px; text-transform: uppercase; color:#565959; font-weight: 800; display:block; margin-bottom: 6px; letter-spacing: 0.5px;">Shipping Address</span>
                    <strong style="font-size: 13px; color:#0f1111; display:block;">{user.full_name}</strong>
                    <p style="font-size: 12px; color:#333333; margin: 4px 0 0 0; line-height: 1.4;">
                      {delivery_addr if delivery_addr else "Address provided in account profile."}
                    </p>
                  </td>
                  <!-- PAYMENT & ORDER SUMMARY -->
                  <td width="50%" style="padding: 16px; vertical-align: top;">
                    <span style="font-size: 11px; text-transform: uppercase; color:#565959; font-weight: 800; display:block; margin-bottom: 6px; letter-spacing: 0.5px;">Payment Summary</span>
                    <span style="font-size: 12px; color:#333333; display:block;">Payment Method: <strong>{order.payment_method}</strong></span>
                    <span style="font-size: 12px; color:#333333; display:block; margin-top: 3px;">Payment Status: <strong style="color:#16a34a;">{order.payment_status}</strong></span>
                    <span style="font-size: 12px; color:#333333; display:block; margin-top: 3px;">Customer Account: <strong>{order.role}</strong></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ITEMS ORDERED TABLE -->
          <tr>
            <td style="padding: 0 28px 20px 28px;">
              <h3 style="font-size: 15px; color:#0f1111; margin:0 0 12px 0; font-weight: 800; border-bottom: 2px solid #eaeded; padding-bottom: 8px;">Ordered Medicine & Supplies</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background-color:#f3f4f6; text-align: left; color:#565959;">
                    <th style="padding: 10px 12px; border-bottom: 2px solid #d5d9d9; font-weight: 800;">Medicine Item</th>
                    <th style="padding: 10px 12px; border-bottom: 2px solid #d5d9d9; font-weight: 800; text-align: center;">Qty</th>
                    <th style="padding: 10px 12px; border-bottom: 2px solid #d5d9d9; font-weight: 800; text-align: right;">Unit Price</th>
                    <th style="padding: 10px 12px; border-bottom: 2px solid #d5d9d9; font-weight: 800; text-align: right;">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items_rows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- PRICE SUMMARY TOTALS -->
          <tr>
            <td style="padding: 0 28px 24px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="40%"></td>
                  <td width="60%">
                    <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px; color:#333333;">
                      <tr>
                        <td align="left">Subtotal:</td>
                        <td align="right" style="font-weight: 600; color:#0f1111;">₹{subtotal_val:,.2f}</td>
                      </tr>
                      {gst_row}
                      {shipping_row}
                      <tr style="font-size: 16px; font-weight: 800; color:#0f1111;">
                        <td align="left" style="padding-top: 10px; border-top: 2px solid #131921;">Total Paid Amount:</td>
                        <td align="right" style="padding-top: 10px; border-top: 2px solid #131921; color:#B12704; font-size: 18px;">₹{order.total_amount:,.2f}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA BUTTON -->
          <tr>
            <td align="center" style="padding: 0 28px 28px 28px;">
              <a href="#" style="background: linear-gradient(to bottom, #f7dfa5, #f0c14b); border: 1px solid #a88734; border-radius: 8px; color: #111111; display: inline-block; font-size: 13px; font-weight: 700; padding: 12px 36px; text-decoration: none; box-shadow: 0 2px 5px rgba(0,0,0,0.15);">
                View or Track Your Order
              </a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f3f4f6; border-top: 1px solid #eaeded; padding: 20px 28px; text-align: center; font-size: 12px; color:#565959; line-height: 1.6;">
              <p style="margin:0 0 4px 0;">We hope to see you again soon.</p>
              <strong style="color:#0f1111;">{brand_display} Enterprise</strong> — Quality Healthcare & B2B Supply Chain<br>
              © 2026 {brand_display}. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def notify_order_created(db: Session, order: Order, user: User):
    settings = get_or_create_settings(db)
    if not settings.notify_order_created:
        return

    brand_name = settings.sender_name if settings.sender_name and "Evvai" in settings.sender_name else "Evvai Pharma"
    subject = f"Order Confirmation #{order.order_code} - {brand_name}"
    
    # Build clean text item summary
    item_lines = []
    if hasattr(order, "items") and order.items:
        for it in order.items:
            item_lines.append(f" - {it.product_name} (Qty: {it.quantity}) @ ₹{it.unit_price:,.2f} = ₹{it.total_price:,.2f}")
    
    items_text_str = "\n".join(item_lines) if item_lines else " - Items Confirmed"

    email_body = (
        f"Dear {user.full_name},\n\n"
        f"Thank you for ordering from {brand_name}!\n\n"
        f"Order Code: #{order.order_code}\n"
        f"Order Status: {order.order_status}\n"
        f"Payment Method: {order.payment_method}\n\n"
        f"Items Ordered:\n"
        f"{items_text_str}\n\n"
        f"Total Amount: ₹{order.total_amount:,.2f}\n\n"
        f"We are processing your order and will send dispatch tracking details shortly.\n\n"
        f"Regards,\n"
        f"{brand_name}"
    )

    html_body = generate_order_created_html(order, user, brand_name)

    sms_body = (
        f"{brand_name}: Order #{order.order_code} confirmed for ₹{order.total_amount:,.2f}. "
        f"Status: {order.order_status}. Thank you for ordering!"
    )

    if user.email:
        send_email_notification(db, user.email, subject, email_body, event_type="ORDER_CREATED", html_body=html_body)
    if user.phone:
        send_sms_notification(db, user.phone, sms_body, event_type="ORDER_CREATED")


def notify_order_status_update(db: Session, order: Order, user: User, new_status: str):
    settings = get_or_create_settings(db)
    if not settings.notify_order_status:
        return

    brand_name = settings.sender_name if settings.sender_name and "Evvai" in settings.sender_name else "Evvai Pharma"
    subject = f"Order #{order.order_code} Status Update: {new_status} - {brand_name}"
    email_body = (
        f"Dear {user.full_name},\n\n"
        f"The status of your order #{order.order_code} has been updated to: {new_status}.\n"
        f"Total Amount: ₹{order.total_amount:,.2f}\n\n"
        f"Track your order details in your {brand_name} dashboard portal.\n\n"
        f"Regards,\n"
        f"{brand_name}"
    )

    html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background-color:#eaeded; padding:20px;">
  <div style="max-width:580px; margin:0 auto; background:#fff; border-radius:8px; padding:28px; border:1px solid #d5d9d9; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
    <div style="background-color:#131921; padding:12px 20px; border-bottom:4px solid #ff9900; margin:-28px -28px 24px -28px; border-radius:8px 8px 0 0;">
      <span style="color:#ffffff; font-size:20px; font-weight:bold;">Evvai <span style="color:#ff9900;">Pharma</span></span>
    </div>
    <h2 style="color:#0f1111; margin-top:0;">Order Status Update</h2>
    <p>Dear <strong>{user.full_name}</strong>,</p>
    <p>Your order <strong>#{order.order_code}</strong> has been updated to status: <span style="background:#2563eb; color:#fff; padding:4px 12px; border-radius:12px; font-weight:bold;">{new_status}</span></p>
    <p style="font-size:14px; color:#333;">Total Order Value: <strong>₹{order.total_amount:,.2f}</strong></p>
    <p style="font-size:13px; color:#565959; margin-top:20px;">Thank you for choosing {brand_name}!</p>
  </div>
</body>
</html>"""

    sms_body = (
        f"{brand_name}: Order #{order.order_code} status updated to {new_status}. "
        f"Check dashboard for details."
    )

    if user.email:
        send_email_notification(db, user.email, subject, email_body, event_type="ORDER_STATUS", html_body=html_body)
    if user.phone:
        send_sms_notification(db, user.phone, sms_body, event_type="ORDER_STATUS")


def notify_kyc_status_update(db: Session, user: User, status: str, comments: str = None):
    settings = get_or_create_settings(db)
    if not settings.notify_kyc_status:
        return

    brand_name = settings.sender_name if settings.sender_name and "Evvai" in settings.sender_name else "Evvai Pharma"
    is_approved = (status.upper() == "APPROVED")
    subject = (
        f"B2B Wholesale KYC Approved - {brand_name}" if is_approved 
        else f"B2B Wholesale KYC Status: {status} - {brand_name}"
    )

    email_body = (
        f"Dear {user.full_name},\n\n"
        f"Your B2B Distributor KYC Verification status has been updated to: {status.upper()}.\n"
    )
    if is_approved:
        email_body += (
            "Congratulations! Your account is now unlocked for Wholesale B2B Tier Pricing & MOQ Discounts.\n"
            "Log in to your distributor portal to start bulk purchasing."
        )
    else:
        email_body += f"Reason / Admin Comments: {comments or 'Please re-upload valid GSTIN & Drug License documents.'}"

    email_body += f"\n\nRegards,\n{brand_name}"

    sms_body = (
        f"{brand_name}: Your B2B KYC status is {status.upper()}. "
        + ("B2B Wholesale prices unlocked!" if is_approved else "Log in to check comments.")
    )

    if user.email:
        send_email_notification(db, user.email, subject, email_body, event_type="KYC_STATUS")
    if user.phone:
        send_sms_notification(db, user.phone, sms_body, event_type="KYC_STATUS")
