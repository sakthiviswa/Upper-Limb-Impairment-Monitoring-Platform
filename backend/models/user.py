"""
User Model
Defines the User table with role-based fields (personal + medical + rehab + doctor profile)
Plain SQLAlchemy model (shared Base/engine defined in database.py).
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, Enum
from database import Base
from security import hash_password, verify_password


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, nullable=False, index=True)
    _password = Column("password", String(256), nullable=False)
    role = Column(
        Enum("patient", "doctor", "admin", name="user_roles"),
        nullable=False,
        default="patient",
    )
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # ── Personal fields (all roles) ───────────────────────────────────────────
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    phone_number = Column(String(20), nullable=True)

    # ── Patient-only medical fields ───────────────────────────────────────────
    injured_arm = Column(String(20), nullable=True)
    injury_type = Column(String(50), nullable=True)
    injury_severity = Column(String(20), nullable=True)
    date_of_injury = Column(String(20), nullable=True)
    doctor_name = Column(String(120), nullable=True)

    # ── Patient rehab preferences ─────────────────────────────────────────────
    session_duration = Column(Integer, nullable=True, default=30)
    difficulty_level = Column(String(20), nullable=True)
    reminder_enabled = Column(Boolean, default=False)

    # ── Doctor-patient relationship ───────────────────────────────────────────
    selected_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    doctor_accepted = Column(Boolean, default=False)

    # ── Doctor-only extended profile fields ───────────────────────────────────
    specialization = Column(String(120), nullable=True)
    qualification = Column(String(200), nullable=True)
    hospital = Column(String(200), nullable=True)
    experience = Column(Integer, nullable=True)
    rating = Column(Float, nullable=True)
    review_count = Column(Integer, nullable=True)
    location = Column(String(200), nullable=True)
    languages = Column(String(200), nullable=True)
    consult_fee = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    availability = Column(String(200), nullable=True)
    verified = Column(Boolean, default=False)
    profile_image = Column(String(300), nullable=True)

    # ── Password helpers ──────────────────────────────────────────────────────
    @property
    def password(self):
        raise AttributeError("Password is write-only")

    @password.setter
    def password(self, plain_text):
        self._password = hash_password(plain_text)

    def check_password(self, plain_text: str) -> bool:
        return verify_password(plain_text, self._password)

    # ── Serialisation ─────────────────────────────────────────────────────────
    def to_dict(self):
        base = {
            "id": self.id,
            "name": self.name,
            "fullName": self.name,
            "email": self.email,
            "role": self.role,
            "age": self.age,
            "gender": self.gender,
            "phoneNumber": self.phone_number,
            "injuredArm": self.injured_arm,
            "injuryType": self.injury_type,
            "injurySeverity": self.injury_severity,
            "dateOfInjury": self.date_of_injury,
            "doctorName": self.doctor_name,
            "sessionDuration": self.session_duration,
            "difficultyLevel": self.difficulty_level,
            "reminderEnabled": self.reminder_enabled,
            "selectedDoctorId": self.selected_doctor_id,
            "assignedDoctorId": self.assigned_doctor_id,
            "doctorAccepted": self.doctor_accepted,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if self.role in ("doctor", "admin"):
            base.update({
                "specialization": self.specialization or "",
                "qualification": self.qualification or "",
                "hospital": self.hospital or "",
                "experience": self.experience,
                "rating": self.rating,
                "review_count": self.review_count,
                "location": self.location or "",
                "languages": self.languages or "",
                "consult_fee": self.consult_fee or "",
                "bio": self.bio or "",
                "availability": self.availability or "",
                "verified": self.verified or False,
                "profile_image": self.profile_image,
            })
        return base

    def __repr__(self):
        return f"<User {self.email} [{self.role}]>"
