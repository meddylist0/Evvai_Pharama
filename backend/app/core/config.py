import os
from typing import List
from pydantic_settings import BaseSettings

# Absolute canonical path to the database file in backend directory
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_CANONICAL_DB_PATH = os.path.join(_BACKEND_DIR, "pharmalink.db").replace("\\", "/")


class Settings(BaseSettings):
    PROJECT_NAME: str = "PharmaLink Enterprise API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    
    # Security & JWT
    SECRET_KEY: str = "pharmalink-dev-secret-key-32-chars-minimum-sec-hash-random-2026!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # Extended 30 days for retailer/distributor/customer
    ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # Extended 7 days for admin
    JWT_ISSUER: str = "pharmalink-api"
    JWT_AUDIENCE: str = "pharmalink-app"
    
    # Database (defaults to canonical SQLite file database)
    DATABASE_URL: str = f"sqlite:///{_CANONICAL_DB_PATH}"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost",
        "https://localhost",
        "capacitor://localhost",
        "ionic://localhost",
        "http://192.168.0.155:3000",
        "http://192.168.0.155:8000",
    ]
    
    # Razorpay Payment Gateway Settings
    RAZORPAY_KEY_ID: str = "rzp_test_Bvq9kiuaq8gkcs"
    RAZORPAY_KEY_SECRET: str = "TEST_RAZORPAY_SECRET_PLACEHOLDER_KEY"
    RAZORPAY_ENABLED: bool = True
    RAZORPAY_MODE: str = "test"  # "test" | "live"
    
    # SMTP Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "notifications@evvaipharma.com"
    SMTP_PASSWORD: str = "app_password_secret"
    SENDER_EMAIL: str = "orders@evvaipharma.com"
    SENDER_NAME: str = "Evvai Pharma"
    EMAIL_ENABLED: bool = True

    # SMS Gateway Configuration
    SMS_PROVIDER: str = "Twilio / Fast2SMS"
    SMS_API_KEY: str = "SK_TEST_SMS_9988776655"
    SMS_SENDER_ID: str = "EVVAI"
    SMS_ENABLED: bool = True

    def validate_production_security(self):
        if self.ENVIRONMENT.lower() == "production":
            weak_secrets = [
                "pharmalink-super-secret-production-jwt-key-change-in-env-2026",
                "pharmalink-dev-secret-key-32-chars-minimum-sec-hash-random-2026!",
                "secret", "change-me", "12345678", "TEST_RAZORPAY_SECRET_PLACEHOLDER_KEY"
            ]
            if not self.SECRET_KEY or self.SECRET_KEY in weak_secrets or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "CRITICAL SECURITY ERROR: Production environment requires a strong SECRET_KEY "
                    "(minimum 32 characters) set via environment variable."
                )
            if self.RAZORPAY_KEY_SECRET in weak_secrets:
                raise ValueError(
                    "CRITICAL SECURITY ERROR: Production environment requires a real RAZORPAY_KEY_SECRET."
                )

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
settings.validate_production_security()
