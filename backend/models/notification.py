"""
models/notification.py
Handles all platform notifications. Plain SQLAlchemy model.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(
        Enum(
            "doctor_request",
            "request_accepted",
            "request_declined",
            "report_ready",
            "exercise_assigned",
            name="notif_types",
        ),
        nullable=False,
    )
    message = Column(String(500), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self):
        return {
            "id": self.id,
            "recipientId": self.recipient_id,
            "senderId": self.sender_id,
            "type": self.type,
            "message": self.message,
            "isRead": self.is_read,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
