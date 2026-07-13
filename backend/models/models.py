"""
SQLAlchemy Database Models
==========================
Tables:
  - patients       : user accounts
  - rehab_sessions : each 30-second monitoring session
  - session_angles : raw angle readings (timeseries)
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, Float, String, Text,
    DateTime, ForeignKey, JSON, Enum
)
from sqlalchemy.orm import relationship
import enum

from database import Base


class InjuryStatus(str, enum.Enum):
    IMPROVING     = "improving"
    STABLE        = "stable"
    NEEDS_ATTENTION = "needs_attention"
    FIRST_SESSION = "first_session"


# ── Patient ────────────────────────────────────────────────────────────────────
class Patient(Base):
    __tablename__ = "patients"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(120), nullable=False)
    email        = Column(String(180), unique=True, nullable=False, index=True)
    doctor_email = Column(String(180), nullable=False)          # who gets the report
    condition    = Column(String(200), default="Shoulder Rehabilitation")
    target_angle = Column(Float, default=90.0)                  # target ROM in degrees
    created_at   = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sessions = relationship("RehabSession", back_populates="patient",
                            cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "doctor_email": self.doctor_email,
            "condition": self.condition,
            "target_angle": self.target_angle,
            "created_at": self.created_at.isoformat(),
        }


# ── Rehab Session ──────────────────────────────────────────────────────────────
class RehabSession(Base):
    __tablename__ = "rehab_sessions"

    id              = Column(Integer, primary_key=True, index=True)
    patient_id      = Column(Integer, ForeignKey("patients.id"), nullable=False)

    # ── Core metrics ──────────────────────────────────────────────────────────
    avg_angle       = Column(Float, nullable=False)
    max_angle       = Column(Float, nullable=False)
    min_angle       = Column(Float, nullable=False)
    accuracy        = Column(Float, nullable=False)   # % match to target angle
    consistency     = Column(Float, nullable=False)   # std deviation (lower = better)
    duration_secs   = Column(Integer, default=30)
    frame_count     = Column(Integer, default=0)

    # ── Injury tracking ───────────────────────────────────────────────────────
    injury_status   = Column(Enum(InjuryStatus), default=InjuryStatus.FIRST_SESSION)
    angle_delta     = Column(Float, default=0.0)       # vs previous session

    # ── File paths ────────────────────────────────────────────────────────────
    graph_path      = Column(String(300), nullable=True)   # angle-vs-time PNG
    progress_path   = Column(String(300), nullable=True)   # multi-session PNG
    pdf_path        = Column(String(300), nullable=True)   # full PDF report

    # ── Raw data ──────────────────────────────────────────────────────────────
    angle_series    = Column(JSON, default=list)  # [{t: 0.5, angle: 85.3}, ...]

    # ── Notes ─────────────────────────────────────────────────────────────────
    doctor_notes    = Column(Text, default="")
    created_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="sessions")

    def to_dict(self):
        return {
            "id":             self.id,
            "patient_id":     self.patient_id,
            "avg_angle":      self.avg_angle,
            "max_angle":      self.max_angle,
            "min_angle":      self.min_angle,
            "accuracy":       self.accuracy,
            "consistency":    self.consistency,
            "duration_secs":  self.duration_secs,
            "frame_count":    self.frame_count,
            "injury_status":  self.injury_status.value if self.injury_status else None,
            "angle_delta":    self.angle_delta,
            "graph_path":     self.graph_path,
            "progress_path":  self.progress_path,
            "pdf_path":       self.pdf_path,
            "angle_series":   self.angle_series,
            "doctor_notes":   self.doctor_notes,
            "created_at":     self.created_at.isoformat(),
        }