import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    citizen = "citizen"
    ward_staff = "ward_staff"
    district_staff = "district_staff"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.citizen, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    applications = relationship(
        "Application", back_populates="applicant", foreign_keys="Application.applicant_id"
    )
