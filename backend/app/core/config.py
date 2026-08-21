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
    # Default development secret key for local dev only (MUST be overridden in production .env)
    SECRET_KEY: str = "pharmalink-dev-secret-key-32-chars-minimum-sec-hash-random-2026!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # Default 24 hours (1440 minutes)
    
    # Database (defaults to canonical SQLite file database)
    DATABASE_URL: str = f"sqlite:///{_CANONICAL_DB_PATH}"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    
    # Razorpay Payment Gateway Settings
    RAZORPAY_KEY_ID: str = "rzp_test_Bvq9kiuaq8gkcs"
    RAZORPAY_KEY_SECRET: str = "TEST_RAZORPAY_SECRET_PLACEHOLDER_KEY"
    RAZORPAY_ENABLED: bool = True
    RAZORPAY_MODE: str = "test"  # "test" | "live"
    
    def validate_production_security(self):
        if self.ENVIRONMENT.lower() == "production":
            weak_secrets = [
                "pharmalink-super-secret-production-jwt-key-change-in-env-2026",
                "pharmalink-dev-secret-key-32-chars-minimum-sec-hash-random-2026!",
                "secret", "change-me", "12345678"
            ]
            if not self.SECRET_KEY or self.SECRET_KEY in weak_secrets or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "CRITICAL SECURITY ERROR: Production environment requires a strong SECRET_KEY "
                    "(minimum 32 characters) set via environment variable."
                )

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
settings.validate_production_security()

