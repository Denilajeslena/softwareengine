import os
from typing import List


class Config:
    """Base configuration loaded from environment variables."""
    SECRET_KEY = os.getenv("SECRET_KEY", "scholars-shelf-super-secure-flask-secret-key-2026")
    DEBUG = os.getenv("FLASK_DEBUG", "0").lower() in ("1", "true", "yes")
    PORT = int(os.getenv("PORT", "5000"))
    HOST = os.getenv("HOST", "127.0.0.1")

    # JWT Authentication settings (>= 32 bytes for HMAC-SHA256)
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "scholars-shelf-super-secure-jwt-secret-key-2026-production-ready")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

    # Allowed CORS Origins
    _raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    CORS_ORIGINS: List[str] = [origin.strip() for origin in _raw_cors.split(",") if origin.strip()]

    # MongoDB settings
    MONGODB_URI = os.getenv("MONGODB_URI", "")
    MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "scholars_shelf")
    MONGODB_TIMEOUT_MS = int(os.getenv("MONGODB_TIMEOUT_MS", "2500"))


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    MONGODB_DB_NAME = "scholars_shelf_test"
    MONGODB_TIMEOUT_MS = 1000
    JWT_EXPIRATION_HOURS = 1


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
