"""
Database Configuration
Supports PostgreSQL (production) or SQLite (dev fallback)
Set DATABASE_URL in .env to switch.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Default to SQLite for easy local dev; swap for PostgreSQL in production
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./rehab_monitor.db"
)

# PostgreSQL example:
# DATABASE_URL = "postgresql://user:password@localhost:5432/rehab_monitor"

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency for DB sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()