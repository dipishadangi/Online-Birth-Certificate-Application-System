from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password
from app.deps import require_roles
from app.models.user import User, UserRole
from app.models.application import Application, ApplicationStatus, AuditLog
from app.schemas.user import UserOut, UserCreate
from app.schemas.application import ApplicationOut, StatsOut, AuditLogOut

router = APIRouter(prefix="/api/admin", tags=["admin"])
admin_only = require_roles(UserRole.admin)


@router.get("/users", response_model=List[UserOut])
def list_users(current_user: User = Depends(admin_only), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_staff_user(
    payload: UserCreate,
    current_user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    """Admin-only: create staff/admin accounts with a specific role."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/toggle-active", response_model=UserOut)
def toggle_user_active(
    user_id: int,
    current_user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


@router.get("/applications", response_model=List[ApplicationOut])
def all_applications(current_user: User = Depends(admin_only), db: Session = Depends(get_db)):
    return db.query(Application).order_by(Application.created_at.desc()).all()


@router.get("/audit-logs", response_model=List[AuditLogOut])
def all_audit_logs(current_user: User = Depends(admin_only), db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()


@router.get("/stats", response_model=StatsOut)
def stats(current_user: User = Depends(admin_only), db: Session = Depends(get_db)):
    total = db.query(Application).count()
    counts = {
        s.value: db.query(Application).filter(Application.status == s).count()
        for s in ApplicationStatus
    }
    return StatsOut(total=total, **counts)
