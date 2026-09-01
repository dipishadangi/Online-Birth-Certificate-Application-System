import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text, Date
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

    # Status
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.pending, nullable=False)
    rejection_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    applicant = relationship("User", back_populates="applications", foreign_keys=[applicant_id])
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan", lazy="selectin")
    audit_logs = relationship("AuditLog", back_populates="application", cascade="all, delete-orphan", lazy="selectin")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)

    file_name = Column(String, nullable=False)
    file_content_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    document_type = Column(String, nullable=False)

    # Cloudinary storage
    cloudinary_public_id = Column(String, nullable=True)
    cloudinary_url = Column(String, nullable=True)

    uploaded_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="documents")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="audit_logs")
    actor = relationship("User")