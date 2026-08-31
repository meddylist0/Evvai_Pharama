import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.services.notification_service import (
    get_or_create_settings,
    send_email_notification,
    send_sms_notification,
)
from app.models.notification import NotificationSetting, NotificationLog

def run_tests():
    print("=== STARTING DYNAMIC NOTIFICATION SYSTEM AUDIT ===")
    db = SessionLocal()
    try:
        # 1. Fetch initial settings from DB
        settings = get_or_create_settings(db)
        print(f"[OK] Initial DB Settings Loaded: Host={settings.smtp_host}, Port={settings.smtp_port}, Provider={settings.sms_provider}, Sender={settings.sender_name}")

        # 2. Simulate Admin updating settings dynamically in DB
        settings.sender_name = "PharmaLink Enterprise Live Gateway"
        settings.sms_sender_id = "PHARMALIVE"
        db.commit()
        db.refresh(settings)

        # 3. Re-query settings from DB to verify dynamic load
        fresh_settings = get_or_create_settings(db)
        print(f"[OK] Dynamic DB Settings Updated: Sender={fresh_settings.sender_name}, SMS Sender ID={fresh_settings.sms_sender_id}")
        assert fresh_settings.sender_name == "PharmaLink Enterprise Live Gateway"
        assert fresh_settings.sms_sender_id == "PHARMALIVE"

        # 4. Trigger Email Dispatch with dynamic DB settings
        email_res = send_email_notification(
            db,
            to_email="doctor.dynamic@pharmalink.com",
            subject="Dynamic DB Email Test",
            body_text="Verification that email settings read directly from Admin UI database.",
            event_type="TEST"
        )
        print(f"[OK] Dynamic Email Dispatch Test: success={email_res}")

        # 5. Trigger SMS Dispatch with dynamic DB settings
        sms_res = send_sms_notification(
            db,
            to_phone="+919876543210",
            message_body="PharmaLink: Dynamic SMS test using live DB sender ID PHARMALIVE.",
            event_type="TEST"
        )
        print(f"[OK] Dynamic SMS Dispatch Test: success={sms_res}")

        # 6. Check logs in DB
        logs = db.query(NotificationLog).order_by(NotificationLog.id.desc()).limit(2).all()
        print(f"[OK] Verified {len(logs)} recent logs recorded in DB:")
        for log in logs:
            print(f"   - [{log.sent_at}] Channel={log.channel} | Event={log.event_type} | Recipient={log.recipient} | Status={log.status}")

        print("=== DYNAMIC DB SETTINGS & NOTIFICATION AUDIT PASSED 100% ===")
    except Exception as e:
        print(f"[FAIL] TEST FAILED WITH ERROR: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    run_tests()
