"""
Healthcare Auth System - Configuration
Supports SQLite (default) or MySQL via environment variables
"""

import os
from datetime import timedelta


class Config:
    # ── Security ──────────────────────────────────────────────────────────────
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    # ── Database ──────────────────────────────────────────────────────────────
    # To use MySQL: set DATABASE_URL="mysql+pymysql://user:pass@host/dbname"
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///healthcare.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}