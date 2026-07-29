import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Enum, DateTime, ForeignKey, Text, Date
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    under_review = "under_review"
    forwarded = "forwarded"
    approved = "approved"
    rejected = "rejected"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Child details
    child_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    place_of_birth = Column(String, nullable=False)
    gender = Column(String, nullable=False)

    # Parent details
    father_name = Column(String, nullable=False)
    mother_name = Column(String, nullable=False)
    permanent_address = Column(String, nullable=False)

    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.pending, nullable=False)
    rejection_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applicant = relationship("User", back_populates="applications", foreign_keys=[applicant_id])
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="application", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    document_type = Column(String, nullable=False)  # e.g. "hospital_record", "parent_id"
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="documents")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # e.g. "approved", "rejected", "forwarded"
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="audit_logs")
    actor = relationship("User")
