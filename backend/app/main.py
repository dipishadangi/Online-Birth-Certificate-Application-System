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
    """Create a default admin account if one doesn't exist yet."""
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "admin@example.com").first():
            db.add(User(
                full_name="System Administrator",
                email="admin@example.com",
                hashed_password=hash_password("admin123"),
                role=UserRole.admin,
                is_active=True,
            ))
            db.commit()
            print("Auto-seeded default admin: admin@example.com")
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
        print(f"Warning: Startup DB init error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(asyncio.to_thread(run_startup_db_init))
    yield


app = FastAPI(
    title="Online Birth Certificate Application System",
    description="E-Governance Lab Project API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https?://.*",
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