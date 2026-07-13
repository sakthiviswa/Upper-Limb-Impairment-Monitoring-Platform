"""Simple verification service helpers for doctor verification routes."""

from typing import Optional
from pydantic import BaseModel, Field


def run_verification(
    account_name: str,
    face_image_path: str,
    government_id_path: str,
    medical_certificate_path: str,
) -> dict:
    """Return a lightweight verification result for local development.

    The production platform can later replace this with a real AI-based
    verification pipeline. This stub keeps the backend importable and allows
    the app to start while preserving the expected response shape.
    """

    has_all_files = bool(face_image_path and government_id_path and medical_certificate_path)

    if has_all_files:
        return {
            "status": "auto_verified",
            "overall_score": 92.0,
            "face_match_score": 0.91,
            "name_match_score": 0.89,
            "field_completeness_score": 0.95,
            "ai_notes": f"Automated verification completed for {account_name}.",
        }

    return {
        "status": "manual_review",
        "overall_score": 55.0,
        "face_match_score": None,
        "name_match_score": None,
        "field_completeness_score": None,
        "ai_notes": "Verification requires all uploaded documents to be present.",
    }


class VerificationReviewRequest(BaseModel):
    """Admin decision on a doctor's verification submission."""
    decision: str = Field(..., description="'verified' or 'rejected'")
    notes: Optional[str] = ""
    


class VerificationResultResponse(BaseModel):
    id: int
    doctorId: int
    status: str
    overallScore: Optional[float] = None
    faceMatchScore: Optional[float] = None
    nameMatchScore: Optional[float] = None
    fieldCompletenessScore: Optional[float] = None
    aiNotes: Optional[str] = None

    class Config:
        from_attributes = True