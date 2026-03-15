"""
Appointment model — add this to your existing models.py
"""

import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base


class AppointmentType(str, enum.Enum):
    ONLINE  = "online"
    OFFLINE = "offline"


class AppointmentStatus(str, enum.Enum):
    PENDING   = "pending"
    CONFIRMED = "confirmed"
    DECLINED  = "declined"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Appointment(Base):
    __tablename__ = "appointments"

    id               = Column(Integer, primary_key=True, index=True)

    # Participants (linked to your User model by email/id — adjust FK to match your User table)
    patient_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id        = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Scheduling
    appointment_date = Column(DateTime, nullable=False)          # UTC datetime
    duration_mins    = Column(Integer, default=30)               # 30 / 45 / 60

    # Type
    type             = Column(Enum(AppointmentType), nullable=False)
    location         = Column(String(300), nullable=True)        # clinic address for offline
    meet_link        = Column(String(500), nullable=True)        # auto-generated for online

    # Status
    status           = Column(Enum(AppointmentStatus), default=AppointmentStatus.PENDING)

    # Notes
    reason           = Column(Text, default="")                  # patient fills in
    doctor_notes     = Column(Text, default="")                  # doctor fills in after

    # Notifications sent flags
    patient_notified = Column(Boolean, default=False)
    doctor_notified  = Column(Boolean, default=False)

    created_at       = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at       = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                              onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id":               self.id,
            "patient_id":       self.patient_id,
            "doctor_id":        self.doctor_id,
            "appointment_date": self.appointment_date.isoformat(),
            "duration_mins":    self.duration_mins,
            "type":             self.type.value if self.type else None,
            "location":         self.location,
            "meet_link":        self.meet_link,
            "status":           self.status.value if self.status else None,
            "reason":           self.reason,
            "doctor_notes":     self.doctor_notes,
            "created_at":       self.created_at.isoformat(),
            "updated_at":       self.updated_at.isoformat(),
        }