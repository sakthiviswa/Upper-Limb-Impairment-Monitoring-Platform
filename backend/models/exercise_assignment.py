"""
ExerciseAssignment model
========================
Defines prescriptions assigned by doctors to patients. Plain SQLAlchemy model.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base


class ExerciseAssignment(Base):
    __tablename__ = "exercise_assignments"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    exercises = Column(JSON, default=list)
    doctor_note = Column(Text, default="")
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    doctor = relationship("User", foreign_keys=[doctor_id])
    patient = relationship("User", foreign_keys=[patient_id])

    def to_dict(self):
        def _normalise_exercise(ex: dict, index: int) -> dict:
            return {
                "id": ex.get("id", index),
                "name": ex.get("name", "Exercise"),
                "sets": ex.get("sets", 1),
                "reps": ex.get("reps", 1),
                "intensity": ex.get("intensity") or "Low",
                "duration": ex.get("duration") or "—",
                "notes": ex.get("notes") or "",
            }

        raw_exercises = self.exercises or []
        return {
            "id": self.id,
            "doctorName": self.doctor.name if self.doctor else "Your Doctor",
            "doctorNote": self.doctor_note or "",
            "createdAt": (self.created_at.isoformat() + "Z") if self.created_at else None,
            "exercises": [
                _normalise_exercise(ex, i)
                for i, ex in enumerate(raw_exercises)
            ],
        }
