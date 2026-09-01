from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.application import Application, ApplicationStatus, Document, AuditLog
from app.schemas.application import ApplicationCreate, ApplicationOut, ApplicationDecision, AuditLogOut
from app.services.cloudinary_service import cloudinary_service

router = APIRouter(prefix="/api/applications", tags=["applications"])

STAFF_ROLES = (UserRole.ward_staff, UserRole.district_staff, UserRole.admin)


def _get_app_or_404(db: Session, app_id: int) -> Application:
    """Fetch an application by ID or raise 404."""
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


def _check_access(application: Application, user: User):
    """Ensure the user is the owner or a staff/admin member."""
    if application.applicant_id != user.id and user.role not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Not authorized")


def _log_and_commit(db: Session, application: Application, actor_id: int, action: str, notes: str = None):
    """Add an audit log entry, commit, and refresh the application."""
    db.add(AuditLog(application_id=application.id, actor_id=actor_id, action=action, notes=notes))
    db.commit()
    db.refresh(application)


# ── Citizen endpoints ──

@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def submit_application(
    payload: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = Application(applicant_id=current_user.id, **payload.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    _log_and_commit(db, application, current_user.id, "submitted")
    return application


@router.get("/my", response_model=List[ApplicationOut])
def my_applications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Application).filter(
        Application.applicant_id == current_user.id
    ).order_by(Application.created_at.desc()).all()


@router.post("/{application_id}/documents", response_model=ApplicationOut)
def upload_document(
    application_id: int,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = _get_app_or_404(db, application_id)
    _check_access(application, current_user)

    upload_result = cloudinary_service.upload_file(file, folder="birth_certificates")

    db.add(Document(
        application_id=application.id,
        file_name=file.filename or "uploaded_document",
        file_content_type=file.content_type or "application/octet-stream",
        file_size=upload_result.get("bytes") or getattr(file, "size", None),
        cloudinary_public_id=upload_result.get("public_id", "unknown"),
        cloudinary_url=upload_result.get("secure_url"),
        document_type=document_type,
        uploaded_at=datetime.utcnow(),
    ))
    db.commit()
    db.refresh(application)
    return application


@router.get("/{application_id}/documents/{doc_id}")
def download_document(
    application_id: int,
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = _get_app_or_404(db, application_id)
    _check_access(application, current_user)

    doc = db.query(Document).filter(
        Document.id == doc_id, Document.application_id == application_id
    ).first()
    if not doc or not doc.cloudinary_public_id:
        raise HTTPException(status_code=404, detail="Document not found")

    return cloudinary_service.download_file_response(doc)


# ── Shared endpoints ──

@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = _get_app_or_404(db, application_id)
    _check_access(application, current_user)
    return application


@router.get("/{application_id}/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    application_id: int,
    current_user: User = Depends(require_roles(UserRole.ward_staff, UserRole.district_staff, UserRole.admin)),
    db: Session = Depends(get_db),
):
    application = _get_app_or_404(db, application_id)
    return application.audit_logs


# ── Ward Staff endpoints ──

@router.get("/queue/ward", response_model=List[ApplicationOut])
def ward_queue(
    current_user: User = Depends(require_roles(UserRole.ward_staff)),
    db: Session = Depends(get_db),
):
    return db.query(Application).filter(
        Application.status.in_([ApplicationStatus.pending, ApplicationStatus.under_review])
    ).order_by(Application.created_at.asc()).all()


@router.post("/{application_id}/ward-decision", response_model=ApplicationOut)
def ward_decision(
    application_id: int,
    decision: ApplicationDecision,
    current_user: User = Depends(require_roles(UserRole.ward_staff)),
    db: Session = Depends(get_db),
):
    application = _get_app_or_404(db, application_id)

    action_map = {
        "approve": (ApplicationStatus.approved, "approved"),
        "reject": (ApplicationStatus.rejected, "rejected"),
        "forward": (ApplicationStatus.forwarded, "forwarded to district office"),
    }
    if decision.action not in action_map:
        raise HTTPException(status_code=400, detail="Invalid action")

    new_status, label = action_map[decision.action]
    application.status = new_status
    if decision.action == "reject":
        application.rejection_reason = decision.reason

    _log_and_commit(db, application, current_user.id, label, decision.reason)
    return application


# ── District Staff endpoints ──

@router.get("/queue/district", response_model=List[ApplicationOut])
def district_queue(
    current_user: User = Depends(require_roles(UserRole.district_staff)),
    db: Session = Depends(get_db),
):
    return db.query(Application).filter(
        Application.status == ApplicationStatus.forwarded
    ).order_by(Application.created_at.asc()).all()


@router.post("/{application_id}/district-decision", response_model=ApplicationOut)
def district_decision(
    application_id: int,
    decision: ApplicationDecision,
    current_user: User = Depends(require_roles(UserRole.district_staff)),
    db: Session = Depends(get_db),
):
    application = _get_app_or_404(db, application_id)

    if application.status != ApplicationStatus.forwarded:
        raise HTTPException(status_code=400, detail="Application has not been forwarded to district office")

    action_map = {
        "approve": (ApplicationStatus.approved, "final approval by district office"),
        "reject": (ApplicationStatus.rejected, "rejected by district office"),
    }
    if decision.action not in action_map:
        raise HTTPException(status_code=400, detail="Invalid action")

    new_status, label = action_map[decision.action]
    application.status = new_status
    if decision.action == "reject":
        application.rejection_reason = decision.reason

    _log_and_commit(db, application, current_user.id, label, decision.reason)
    return application


# ── Admin Override endpoint ──

@router.post("/{application_id}/admin-decision", response_model=ApplicationOut)
def admin_decision(
    application_id: int,
    decision: ApplicationDecision,
    current_user: User = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db),
):
    """Admin-only: override the status of any application."""
    application = _get_app_or_404(db, application_id)

    if decision.action == "approve":
        application.status = ApplicationStatus.approved
        label = "approved by admin (override)"
    elif decision.action == "reject":
        if not decision.reason:
            raise HTTPException(status_code=400, detail="Reason is required when rejecting.")
        application.status = ApplicationStatus.rejected
        application.rejection_reason = decision.reason
        label = "rejected by admin (override)"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'.")

    _log_and_commit(db, application, current_user.id, label, decision.reason)
    return application
