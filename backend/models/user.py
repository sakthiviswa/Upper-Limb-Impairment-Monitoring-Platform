"""
User Model
Defines the User table with role-based fields (personal + medical + rehab + doctor profile)
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

    # ── Doctor-only extended profile fields ───────────────────────────────────
    specialization = db.Column(db.String(120), nullable=True)   # e.g. "Orthopedic Rehab"
    qualification  = db.Column(db.String(200), nullable=True)   # e.g. "MBBS, MS Ortho"
    hospital       = db.Column(db.String(200), nullable=True)   # e.g. "Apollo Hospitals"
    experience     = db.Column(db.Integer,     nullable=True)   # years of experience
    rating         = db.Column(db.Float,       nullable=True)   # e.g. 4.8
    review_count   = db.Column(db.Integer,     nullable=True)   # number of reviews
    location       = db.Column(db.String(200), nullable=True)   # e.g. "Chennai, Tamil Nadu"
    languages      = db.Column(db.String(200), nullable=True)   # e.g. "English, Tamil"
    consult_fee    = db.Column(db.String(50),  nullable=True)   # e.g. "₹500"
    bio            = db.Column(db.Text,        nullable=True)   # free-text about the doctor
    availability   = db.Column(db.String(200), nullable=True)   # e.g. "Mon–Fri, 9am–5pm"
    verified       = db.Column(db.Boolean,     default=False)   # admin-verified badge
    profile_image  = db.Column(db.String(300), nullable=True)   # URL or relative path

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
        base = {
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
        # Include doctor profile fields for doctor/admin roles
        if self.role in ("doctor", "admin"):
            base.update({
                "specialization": self.specialization or "",
                "qualification":  self.qualification  or "",
                "hospital":       self.hospital        or "",
                "experience":     self.experience,
                "rating":         self.rating,
                "review_count":   self.review_count,
                "location":       self.location        or "",
                "languages":      self.languages       or "",
                "consult_fee":    self.consult_fee     or "",
                "bio":            self.bio             or "",
                "availability":   self.availability    or "",
                "verified":       self.verified        or False,
                "profile_image":  self.profile_image,
            })
        return base

    def __repr__(self):
        return f"<User {self.email} [{self.role}]>"