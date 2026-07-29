"""
Run this once to create the first admin account:
    python seed_admin.py
"""
from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.user import User, UserRole

Base.metadata.create_all(bind=engine)

db = SessionLocal()

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"  # change this after first login

existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
if existing:
    print(f"Admin already exists: {ADMIN_EMAIL}")
else:
    admin = User(
        full_name="System Administrator",
        email=ADMIN_EMAIL,
        hashed_password=hash_password(ADMIN_PASSWORD),
        role=UserRole.admin,
    )
    db.add(admin)
    db.commit()
    print(f"Created admin user -> email: {ADMIN_EMAIL}  password: {ADMIN_PASSWORD}")

db.close()
