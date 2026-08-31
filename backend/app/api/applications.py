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
from app.services.cloudinary_service import cloudinary_service

router = APIRouter(prefix="/api/applications", tags=["applications"])



# ---------- Citizen endpoints ----------

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

    db.add(AuditLog(application_id=application.id, actor_id=current_user.id, action="submitted"))
    db.commit()
    return application


@router.get("/my", response_model=List[ApplicationOut])
def my_applications(
    current_user: User = Depends(get_current_user),
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
        raise HTTPException(status_code=403, detail="Not your application")


    upload_result = cloudinary_service.upload_file(file, folder="birth_certificates")
    content_type = file.content_type or "application/octet-stream"

    doc = Document(
        application_id=application.id,
        file_name=file.filename or "uploaded_document",
        file_content_type=content_type,
        file_size=upload_result.get("bytes") or file.size,
        cloudinary_public_id=upload_result["public_id"],
        cloudinary_url=upload_result.get("secure_url"),
        document_type=document_type,
    )
    db.add(doc)
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
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # authorization: owner or staff/admin
    is_owner = application.applicant_id == current_user.id
    is_staff_or_admin = current_user.role in (
        UserRole.ward_staff, UserRole.district_staff, UserRole.admin
    )
    if not (is_owner or is_staff_or_admin):
        raise HTTPException(status_code=403, detail="Not authorized to view this document")

    doc = db.query(Document).filter(Document.id == doc_id, Document.application_id == application_id).first()
    if not doc or not doc.cloudinary_public_id:
        raise HTTPException(status_code=404, detail="Document not found")

    return cloudinary_service.download_file_response(doc)



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
