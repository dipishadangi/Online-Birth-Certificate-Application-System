import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.api import auth, applications, admin


def seed_initial_admin():
    db = SessionLocal()
    try:
        ADMIN_EMAIL = "admin@example.com"
        ADMIN_PASSWORD = "admin123"

        existing = (
            db.query(User)
            .filter(User.email == ADMIN_EMAIL)
            .first()
        )

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


def run_startup_db_init():
    try:
        Base.metadata.create_all(bind=engine)
        seed_initial_admin()
    except Exception as e:
        print(f"Warning: Startup database initialization error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Launch background DB setup so FastAPI starts serving HTTP requests instantly
    asyncio.create_task(asyncio.to_thread(run_startup_db_init))
    yield


# --------------------------------
# FastAPI application
# --------------------------------

app = FastAPI(
    title="Online Birth Certificate Application System",
    description="E-Governance Lab Project API",
    version="0.1.0",
    lifespan=lifespan,
)


# --------------------------------
# CORS
# --------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------
# API routers
# --------------------------------

app.include_router(auth.router)
app.include_router(applications.router)
app.include_router(admin.router)


# --------------------------------
# Root endpoint
# --------------------------------

@app.get("/")
def root():
    return {
        "message": "Online Birth Certificate Application System API is running"
    }


# --------------------------------
# Health check
# --------------------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "ok"
    }