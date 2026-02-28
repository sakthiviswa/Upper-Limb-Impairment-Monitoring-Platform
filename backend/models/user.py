"""
User Model
Defines the User table with role-based fields
"""

from datetime import datetime, timezone
from extensions import db, bcrypt


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False, index=True)
    _password = db.Column("password", db.String(256), nullable=False)
    role = db.Column(
        db.Enum("patient", "doctor", "admin", name="user_roles"),
        nullable=False,
        default="patient",
    )
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # ── Password helpers ───────────────────────────────────────────────────────
    @property
    def password(self):
        raise AttributeError("Password is write-only")

    @password.setter
    def password(self, plain_text):
        self._password = bcrypt.generate_password_hash(plain_text).decode("utf-8")

    def check_password(self, plain_text: str) -> bool:
        return bcrypt.check_password_hash(self._password, plain_text)

    # ── Serialisation ──────────────────────────────────────────────────────────
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<User {self.email} [{self.role}]>"