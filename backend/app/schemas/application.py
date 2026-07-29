from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel

from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    child_name: str
    date_of_birth: date
    place_of_birth: str
    gender: str
    father_name: str
    mother_name: str
    permanent_address: str


class DocumentOut(BaseModel):
    id: int
    file_name: str
    document_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ApplicationOut(BaseModel):
    id: int
    applicant_id: int
    child_name: str
    date_of_birth: date
    place_of_birth: str
    gender: str
    father_name: str
    mother_name: str
    permanent_address: str
    status: ApplicationStatus
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    documents: List[DocumentOut] = []

    class Config:
        from_attributes = True


class ApplicationDecision(BaseModel):
    """Used by ward/district staff to approve, reject, or forward."""
    action: str  # "approve" | "reject" | "forward"
    reason: Optional[str] = None


class AuditLogOut(BaseModel):
    id: int
    action: str
    notes: Optional[str] = None
    timestamp: datetime
    actor_id: int

    class Config:
        from_attributes = True


class StatsOut(BaseModel):
    total: int
    pending: int
    under_review: int
    forwarded: int
    approved: int
    rejected: int
