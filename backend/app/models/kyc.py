from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import KYCStatus


class DistributorKYC(Base):
    __tablename__ = "distributor_kyc_submissions"

    id = Column(Integer, primary_key=True, index=True)
    distributor_id = Column(Integer, ForeignKey("distributor_profiles.id", ondelete="CASCADE"), nullable=False)
    gst_number = Column(String(50), nullable=False)
    drug_license_no = Column(String(50), nullable=False)
    pan_number = Column(String(50), nullable=True)
    document_file_url = Column(String(255), nullable=True)
    verification_status = Column(Enum(KYCStatus), default=KYCStatus.PENDING, nullable=False)
    admin_remarks = Column(Text, nullable=True)
    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    distributor = relationship("DistributorProfile", back_populates="kyc_submissions")
