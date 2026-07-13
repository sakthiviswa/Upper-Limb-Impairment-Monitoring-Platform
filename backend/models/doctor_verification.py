"""
Doctor Verification Model
==========================
Stores the result of the "Face Image + Government ID + Medical Certificate
-> AI Verification -> Identity Confirmed" flow for a doctor.

One row per verification attempt. A doctor can re-submit (e.g. after a
rejection), so doctor_id is NOT unique - always query
`.order_by(created_at.desc()).first()` to get the latest attempt.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from database import Base

# Lifecycle: pending -> (auto_verified | manual_review) -> (verified | rejected)
VALID_STATUSES = {"pending", "auto_verified", "manual_review", "verified", "rejected"}


class DoctorVerification(Base):
    __tablename__ = "doctor_verifications"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # ── Uploaded files (stored under outputs/verifications/<doctor_id>/) ─────
    face_image_path = Column(String(300), nullable=True)
    government_id_path = Column(String(300), nullable=True)
    medical_certificate_path = Column(String(300), nullable=True)

    # ── Raw OCR text (kept for audit / manual review) ────────────────────────
    government_id_ocr_text = Column(Text, nullable=True)
    medical_certificate_ocr_text = Column(Text, nullable=True)

    # ── Heuristically extracted fields ────────────────────────────────────────
    extracted_id_name = Column(String(200), nullable=True)
    extracted_id_number = Column(String(100), nullable=True)
    extracted_cert_name = Column(String(200), nullable=True)
    extracted_registration_number = Column(String(100), nullable=True)
    extracted_issuing_authority = Column(String(200), nullable=True)

    # ── Scoring ────────────────────────────────────────────────────────────
    face_match_score = Column(Float, nullable=True)     # 0.0 - 1.0
    name_match_score = Column(Float, nullable=True)      # 0.0 - 1.0
    field_completeness_score = Column(Float, nullable=True)  # 0.0 - 1.0
    overall_score = Column(Float, nullable=True)          # 0 - 100

    status = Column(String(20), nullable=False, default="pending")
    ai_notes = Column(Text, nullable=True)  # human-readable explanation of the score

    # ── Admin review (manual override) ────────────────────────────────────────
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self):
        return {
            "id": self.id,
            "doctorId": self.doctor_id,
            "faceImagePath": self.face_image_path,
            "governmentIdPath": self.government_id_path,
            "medicalCertificatePath": self.medical_certificate_path,
            "extractedIdName": self.extracted_id_name,
            "extractedIdNumber": self.extracted_id_number,
            "extractedCertName": self.extracted_cert_name,
            "extractedRegistrationNumber": self.extracted_registration_number,
            "extractedIssuingAuthority": self.extracted_issuing_authority,
            "faceMatchScore": self.face_match_score,
            "nameMatchScore": self.name_match_score,
            "fieldCompletenessScore": self.field_completeness_score,
            "overallScore": self.overall_score,
            "status": self.status,
            "aiNotes": self.ai_notes,
            "reviewerId": self.reviewer_id,
            "reviewNotes": self.review_notes,
            "reviewedAt": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<DoctorVerification doctor_id={self.doctor_id} status={self.status}>"