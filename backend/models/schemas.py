"""Pydantic request/response schemas for sessions."""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class AnglePoint(BaseModel):
    t: float        # seconds since start
    angle: float    # elbow angle in degrees


class SessionCreateRequest(BaseModel):
    patient_id:   int
    angle_series: List[AnglePoint]
    duration_secs: int = 30
    doctor_notes: str = ""


class SessionResponse(BaseModel):
    id:            int
    patient_id:    int
    avg_angle:     float
    max_angle:     float
    min_angle:     float
    accuracy:      float
    consistency:   float
    injury_status: str
    angle_delta:   float
    graph_path:    Optional[str]
    progress_path: Optional[str]
    pdf_path:      Optional[str]
    created_at:    datetime

    class Config:
        from_attributes = True


class PatientCreate(BaseModel):
    name:         str = Field(..., min_length=2)
    email:        str
    doctor_email: str
    condition:    str = "Shoulder Rehabilitation"
    target_angle: float = 90.0