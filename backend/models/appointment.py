"""
Appointment model
==================
Shared across patients and doctors. Uses the same DB/engine as everything
else (single consolidated backend).
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_date = Column(DateTime, nullable=False)
    duration_mins = Column(Integer, default=30)
    type = Column(String(20), nullable=False)  # 'online' | 'offline'
    location = Column(String(300), nullable=True)
    meet_link = Column(String(500), nullable=True)
    status = Column(String(20), default="pending")  # pending|confirmed|declined|cancelled|completed
    reason = Column(Text, default="")
    doctor_notes = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self, patient_name=None, doctor_name=None):
        d = {
            "id": self.id,
            "patient_id": self.patient_id,
            "doctor_id": self.doctor_id,
            "appointment_date": self.appointment_date.isoformat() if self.appointment_date else None,
            "duration_mins": self.duration_mins,
            "type": self.type,
            "location": self.location,
            "meet_link": self.meet_link,
            "status": self.status,
            "reason": self.reason or "",
            "doctor_notes": self.doctor_notes or "",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if patient_name is not None:
            d["patient_name"] = patient_name
        if doctor_name is not None:
            d["doctor_name"] = f"Dr. {doctor_name}" if doctor_name else None
        return d
