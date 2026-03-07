"""
Message & Conversation Models
For doctor ↔ patient chat
Place this file at:  models/message.py
"""

from datetime import datetime, timezone
from extensions import db


class Conversation(db.Model):
    __tablename__ = "conversations"

    id         = db.Column(db.Integer, primary_key=True)
    user1_id   = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    user2_id   = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    messages = db.relationship(
        "Message", backref="conversation",
        lazy="dynamic", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id":        self.id,
            "user1Id":   self.user1_id,
            "user2Id":   self.user2_id,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }


class Message(db.Model):
    __tablename__ = "messages"

    id              = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(
        db.Integer, db.ForeignKey("conversations.id"), nullable=False, index=True
    )
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content   = db.Column(db.Text, nullable=False)
    is_read   = db.Column(db.Boolean, default=False)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    def to_dict(self):
        return {
            "id":             self.id,
            "conversationId": self.conversation_id,
            "senderId":       self.sender_id,
            "content":        self.content,
            "isRead":         self.is_read,
            "createdAt":      self.created_at.isoformat(),
        }