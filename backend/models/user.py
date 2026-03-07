"""
User Model
Defines the User table with role-based fields (personal + medical + rehab)
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

    # ── Personal fields (all roles) ───────────────────────────────────────────
    age          = db.Column(db.Integer, nullable=True)
    gender       = db.Column(db.String(20), nullable=True)
    phone_number = db.Column(db.String(20), nullable=True)

    # ── Patient-only medical fields ───────────────────────────────────────────
    injured_arm      = db.Column(db.String(20),  nullable=True)
    injury_type      = db.Column(db.String(50),  nullable=True)
    injury_severity  = db.Column(db.String(20),  nullable=True)
    date_of_injury   = db.Column(db.String(20),  nullable=True)
    doctor_name      = db.Column(db.String(120), nullable=True)

    # ── Patient rehab preferences ─────────────────────────────────────────────
    session_duration  = db.Column(db.Integer, nullable=True, default=30)
    difficulty_level  = db.Column(db.String(20), nullable=True)
    reminder_enabled  = db.Column(db.Boolean, default=False)

    # ── Doctor-patient relationship ───────────────────────────────────────────
    # The doctor the patient specifically selected in their profile
    selected_doctor_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=True
    )
    # The doctor who actually accepted (set on accept)
    assigned_doctor_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=True
    )
    doctor_accepted = db.Column(db.Boolean, default=False)

    # ── Password helpers ──────────────────────────────────────────────────────
    @property
    def password(self):
        raise AttributeError("Password is write-only")

    @password.setter
    def password(self, plain_text):
        self._password = bcrypt.generate_password_hash(plain_text).decode("utf-8")

    def check_password(self, plain_text: str) -> bool:
        return bcrypt.check_password_hash(self._password, plain_text)

    # ── Serialisation ─────────────────────────────────────────────────────────
    def to_dict(self):
        return {
            "id":                 self.id,
            "name":               self.name,
            "fullName":           self.name,
            "email":              self.email,
            "role":               self.role,
            "age":                self.age,
            "gender":             self.gender,
            "phoneNumber":        self.phone_number,
            "injuredArm":         self.injured_arm,
            "injuryType":         self.injury_type,
            "injurySeverity":     self.injury_severity,
            "dateOfInjury":       self.date_of_injury,
            "doctorName":         self.doctor_name,
            "sessionDuration":    self.session_duration,
            "difficultyLevel":    self.difficulty_level,
            "reminderEnabled":    self.reminder_enabled,
            "selectedDoctorId":   self.selected_doctor_id,
            "assignedDoctorId":   self.assigned_doctor_id,
            "doctorAccepted":     self.doctor_accepted,
            "created_at":         self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<User {self.email} [{self.role}]>"