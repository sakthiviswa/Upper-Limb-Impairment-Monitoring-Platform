"""
Appointment schemas — add to your existing schemas.py
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class AppointmentType(str, Enum):
    ONLINE  = "online"
    OFFLINE = "offline"


class AppointmentStatus(str, Enum):
    PENDING   = "pending"
    CONFIRMED = "confirmed"
    DECLINED  = "declined"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


# ── Request bodies ──────────────────────────────────────────────────

class AppointmentCreateRequest(BaseModel):
    doctor_id:        int
    appointment_date: datetime          # ISO-8601 UTC, e.g. "2025-08-15T14:00:00Z"
    duration_mins:    int   = Field(30, ge=15, le=120)
    type:             AppointmentType
    reason:           str   = ""
    location:         Optional[str] = None   # required when type == offline


class AppointmentRespondRequest(BaseModel):
    """Doctor accepts or declines a booking request."""
    status:       AppointmentStatus     # confirmed | declined
    doctor_notes: str = ""


# ── Response bodies ─────────────────────────────────────────────────

class AppointmentResponse(BaseModel):
    id:               int
    patient_id:       int
    doctor_id:        int
    appointment_date: datetime
    duration_mins:    int
    type:             AppointmentType
    location:         Optional[str]
    meet_link:        Optional[str]
    status:           AppointmentStatus
    reason:           str
    doctor_notes:     str
    created_at:       datetime
    updated_at:       datetime

    # Joined fields populated by the router
    patient_name:     Optional[str] = None
    doctor_name:      Optional[str] = None

    class Config:
        from_attributes = True


class AppointmentListResponse(BaseModel):
    appointments: List[AppointmentResponse]
    total:        int