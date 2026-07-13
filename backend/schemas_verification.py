"""Pydantic response/request schemas for doctor verification routes."""

from typing import Optional
from pydantic import BaseModel, Field


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