import os
import shutil
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.application import Application, ApplicationStatus, Document, AuditLog
from app.schemas.application import (
    ApplicationCreate, ApplicationOut, ApplicationDecision, AuditLogOut
)

router = APIRouter(prefix="/api/applications", tags=["applications"])


# ---------- Citizen endpoints ----------

@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def submit_application(
    payload: ApplicationCreate,
    current_user: User = Depends(require_roles(UserRole.citizen)),
    db: Session = Depends(get_db),
):
    application = Application(applicant_id=current_user.id, **payload.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)

    db.add(AuditLog(application_id=application.id, actor_id=current_user.id, action="submitted"))
    db.commit()
    return application


@router.get("/my", response_model=List[ApplicationOut])
def my_applications(
    current_user: User = Depends(require_roles(UserRole.citizen)),
    db: Session = Depends(get_db),
):
    return (
        db.query(Application)
        .filter(Application.applicant_id == current_user.id)
        .order_by(Application.created_at.desc())
        .all()
    )


@router.post("/{application_id}/documents", response_model=ApplicationOut)
def upload_document(
    application_id: int,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(UserRole.citizen)),
    db: Session = Depends(get_db),
):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your application")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    stored_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(settings.UPLOAD_DIR, stored_name)

    with open(stored_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = Document(
        application_id=application.id,
        file_name=file.filename,
        file_path=stored_path,
        document_type=document_type,
    )
    db.add(doc)
    db.commit()
    db.refresh(application)
    return application


# ---------- Shared: get single application (owner, staff, or admin) ----------

@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    is_owner = application.applicant_id == current_user.id
    is_staff_or_admin = current_user.role in (
        UserRole.ward_staff, UserRole.district_staff, UserRole.admin
    )
    if not (is_owner or is_staff_or_admin):
        raise HTTPException(status_code=403, detail="Not authorized to view this application")
    return application


@router.get("/{application_id}/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    application_id: int,
    current_user: User = Depends(require_roles(
        UserRole.ward_staff, UserRole.district_staff, UserRole.admin
    )),
    db: Session = Depends(get_db),
):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application.audit_logs


# ---------- Ward Office Staff endpoints ----------

@router.get("/queue/ward", response_model=List[ApplicationOut])
def ward_queue(
    current_user: User = Depends(require_roles(UserRole.ward_staff)),
    db: Session = Depends(get_db),
):
    return (
        db.query(Application)
        .filter(Application.status.in_([ApplicationStatus.pending, ApplicationStatus.under_review]))
        .order_by(Application.created_at.asc())
        .all()
    )


@router.post("/{application_id}/ward-decision", response_model=ApplicationOut)
def ward_decision(
    application_id: int,
    decision: ApplicationDecision,
    current_user: User = Depends(require_roles(UserRole.ward_staff)),
    db: Session = Depends(get_db),
):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if decision.action == "approve":
        application.status = ApplicationStatus.approved
        action_label = "approved"
    elif decision.action == "reject":
        application.status = ApplicationStatus.rejected
        application.rejection_reason = decision.reason
        action_label = "rejected"
    elif decision.action == "forward":
        application.status = ApplicationStatus.forwarded
        action_label = "forwarded to district office"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    db.add(AuditLog(
        application_id=application.id,
        actor_id=current_user.id,
        action=action_label,
        notes=decision.reason,
    ))
    db.commit()
    db.refresh(application)
    return application


# ---------- District Office Staff endpoints ----------

@router.get("/queue/district", response_model=List[ApplicationOut])
def district_queue(
    current_user: User = Depends(require_roles(UserRole.district_staff)),
    db: Session = Depends(get_db),
):
    return (
        db.query(Application)
        .filter(Application.status == ApplicationStatus.forwarded)
        .order_by(Application.created_at.asc())
        .all()
    )


@router.post("/{application_id}/district-decision", response_model=ApplicationOut)
def district_decision(
    application_id: int,
    decision: ApplicationDecision,
    current_user: User = Depends(require_roles(UserRole.district_staff)),
    db: Session = Depends(get_db),
):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.status != ApplicationStatus.forwarded:
        raise HTTPException(status_code=400, detail="Application has not been forwarded to district office")

    if decision.action == "approve":
        application.status = ApplicationStatus.approved
        action_label = "final approval by district office"
    elif decision.action == "reject":
        application.status = ApplicationStatus.rejected
        application.rejection_reason = decision.reason
        action_label = "rejected by district office"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    db.add(AuditLog(
        application_id=application.id,
        actor_id=current_user.id,
        action=action_label,
        notes=decision.reason,
    ))
    db.commit()
    db.refresh(application)
    return application


# ---------- Admin Override endpoint ----------

@router.post("/{application_id}/admin-decision", response_model=ApplicationOut)
def admin_decision(
    application_id: int,
    decision: ApplicationDecision,
    current_user: User = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db),
):
    """Admin-only: override the status of any application at any stage."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if decision.action == "approve":
        application.status = ApplicationStatus.approved
        action_label = "approved by admin (override)"
    elif decision.action == "reject":
        if not decision.reason:
            raise HTTPException(status_code=400, detail="Reason is required when rejecting.")
        application.status = ApplicationStatus.rejected
        application.rejection_reason = decision.reason
        action_label = "rejected by admin (override)"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'.")

    db.add(AuditLog(
        application_id=application.id,
        actor_id=current_user.id,
        action=action_label,
        notes=decision.reason,
    ))
    db.commit()
    db.refresh(application)
    return application
