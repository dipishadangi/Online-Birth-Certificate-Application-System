from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central app configuration.
    Values are loaded from environment variables / .env file.
    """

    # -------------------------
    # Database
    # -------------------------
    DATABASE_URL: str

    # -------------------------
    # JWT Authentication
    # -------------------------
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # -------------------------
    # Frontend / CORS
    # -------------------------
    FRONTEND_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"


    # -------------------------
    # Cloudinary
    # -------------------------
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # -------------------------
    # CORS helper
    # -------------------------
    @property
    def cors_origins(self) -> List[str]:
        return [
            origin.strip()
            for origin in self.FRONTEND_ORIGINS.split(",")
            if origin.strip()
        ]

    # -------------------------
    # Environment configuration
    # -------------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()