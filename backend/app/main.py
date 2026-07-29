from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.api import auth, applications, admin

# Create all tables (fine for development; use Alembic migrations for production)
Base.metadata.create_all(bind=engine)


# Auto-seed default admin account if not present
def seed_initial_admin():
    db = SessionLocal()
    try:
        ADMIN_EMAIL = "admin@example.com"
        ADMIN_PASSWORD = "admin123"
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if not existing:
            admin_user = User(
                full_name="System Administrator",
                email=ADMIN_EMAIL,
                hashed_password=hash_password(ADMIN_PASSWORD),
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            print(f"Auto-seeded default admin: {ADMIN_EMAIL}")
    except Exception as e:
        print(f"Error auto-seeding admin: {e}")
        db.rollback()
    finally:
        db.close()


seed_initial_admin()

app = FastAPI(
    title="Online Birth Certificate Application System",
    description="E-Governance Lab Project API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(applications.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "Online Birth Certificate Application System API is running"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
