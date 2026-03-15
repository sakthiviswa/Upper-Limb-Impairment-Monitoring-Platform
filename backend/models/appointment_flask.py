"""
Appointment model for Flask backend.
Uses the same DB as User (extensions.db) so /api/appointments works.
"""

from datetime import datetime, timezone
from extensions import db


class Appointment(db.Model):
    __tablename__ = "appointments"

    id               = db.Column(db.Integer, primary_key=True, index=True)
    patient_id       = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    doctor_id        = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    duration_mins    = db.Column(db.Integer, default=30)
    type             = db.Column(db.String(20), nullable=False)   # 'online' | 'offline'
    location         = db.Column(db.String(300), nullable=True)
    meet_link        = db.Column(db.String(500), nullable=True)
    status           = db.Column(db.String(20), default="pending")  # pending | confirmed | declined | cancelled | completed
    reason           = db.Column(db.Text, default="")
    doctor_notes     = db.Column(db.Text, default="")
    created_at       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self, patient_name=None, doctor_name=None):
        d = {
            "id":               self.id,
            "patient_id":       self.patient_id,
            "doctor_id":        self.doctor_id,
            "appointment_date": self.appointment_date.isoformat() if self.appointment_date else None,
            "duration_mins":    self.duration_mins,
            "type":             self.type,
            "location":         self.location,
            "meet_link":        self.meet_link,
            "status":           self.status,
            "reason":           self.reason or "",
            "doctor_notes":     self.doctor_notes or "",
            "created_at":       self.created_at.isoformat() if self.created_at else None,
            "updated_at":       self.updated_at.isoformat() if self.updated_at else None,
        }
        if patient_name is not None:
            d["patient_name"] = patient_name
        if doctor_name is not None:
            d["doctor_name"] = f"Dr. {doctor_name}" if doctor_name else None
        return d
