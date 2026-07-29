from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.api import auth, applications, admin

# Create all tables (fine for development; use Alembic migrations for production)
Base.metadata.create_all(bind=engine)

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
