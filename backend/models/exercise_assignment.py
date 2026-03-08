"""
ExerciseAssignment model
========================

Defines prescriptions assigned by doctors to patients.  The `exercises` field
is stored as JSON containing a list of dictionaries; each inner dict holds the
exercise details that the frontend expects.  Serialization logic is provided
via `to_dict()` so the API route in `routes/user.py` can return consistent
output.
"""

from datetime import datetime, timezone
from extensions import db


class ExerciseAssignment(db.Model):
    __tablename__ = "exercise_assignments"

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    exercises = db.Column(db.JSON, default=list)
    doctor_note = db.Column(db.Text, default="")
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships (optional convenience)
    doctor = db.relationship("User", foreign_keys=[doctor_id])
    patient = db.relationship("User", foreign_keys=[patient_id])

    def to_dict(self):
        """Return a JSON-serialisable representation for the frontend.

        The shape mirrors what the previous route helper produced.
        """
        # Normalise each exercise entry to guarantee expected keys
        def _normalise_exercise(ex: dict, index: int) -> dict:
            return {
                "id":        ex.get("id", index),
                "name":      ex.get("name", "Exercise"),
                "sets":      ex.get("sets", 1),
                "reps":      ex.get("reps", 1),
                "intensity": ex.get("intensity") or "Low",
                "duration":  ex.get("duration")  or "—",
                "notes":     ex.get("notes")     or "",
            }

        raw_exercises = self.exercises or []
        return {
            "id":         self.id,
            "doctorName": self.doctor.name if self.doctor else "Your Doctor",
            "doctorNote": self.doctor_note or "",
            "createdAt":  self.created_at.isoformat() + "Z",
            "exercises":  [
                _normalise_exercise(ex, i)
                for i, ex in enumerate(raw_exercises)
            ],
        }
