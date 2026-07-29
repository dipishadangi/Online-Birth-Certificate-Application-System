from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    Central app configuration.
    Values are loaded from environment variables / .env file.
    """
    DATABASE_URL: str = "postgresql://neondb_owner:npg_UfL8MdO5CmNn@ep-old-smoke-az05h3oz-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

    SECRET_KEY: str = "f7f55b3f79e8531927bb7c1853d33323a2e515e177c247507190391602cb3342"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    FRONTEND_ORIGINS: str = "http://localhost:5173"

    UPLOAD_DIR: str = "uploads"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
