"""
Notification Model
Handles doctor-patient assignment notifications
"""

from datetime import datetime, timezone
from extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id          = db.Column(db.Integer, primary_key=True)
    # who receives the notification
    recipient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    # who triggered it (the patient)
    sender_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    type         = db.Column(
        db.Enum("doctor_request", "request_accepted", "request_declined", name="notif_types"),
        nullable=False,
    )
    message      = db.Column(db.String(500), nullable=False)
    is_read      = db.Column(db.Boolean, default=False)
    created_at   = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    def to_dict(self):
        return {
            "id":          self.id,
            "recipientId": self.recipient_id,
            "senderId":    self.sender_id,
            "type":        self.type,
            "message":     self.message,
            "isRead":      self.is_read,
            "createdAt":   self.created_at.isoformat(),
        }