"""Pydantic request schemas for user/profile/messages/appointments routes."""

from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel


class ProfileUpdateRequest(BaseModel):
    fullName: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phoneNumber: Optional[str] = None
    # patient fields
    injuredArm: Optional[str] = None
    injuryType: Optional[str] = None
    injurySeverity: Optional[str] = None
    dateOfInjury: Optional[str] = None
    sessionDuration: Optional[int] = None
    difficultyLevel: Optional[str] = None
    reminderEnabled: Optional[bool] = None
    selectedDoctorId: Optional[int] = None


class DoctorProfileUpdateRequest(BaseModel):
    fullName: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phoneNumber: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    hospital: Optional[str] = None
    experience: Optional[int] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    location: Optional[str] = None
    languages: Optional[str] = None
    consult_fee: Optional[str] = None
    bio: Optional[str] = None
    availability: Optional[str] = None
    profile_image: Optional[str] = None
    verified: Optional[bool] = None


class SendMessageRequest(BaseModel):
    conversationId: int
    content: str


class CreateAppointmentRequest(BaseModel):
    doctor_id: int
    appointment_date: str
    duration_mins: Optional[int] = 30
    type: Optional[str] = "online"
    reason: Optional[str] = ""
    location: Optional[str] = None


class RespondAppointmentRequest(BaseModel):
    status: str
    doctor_notes: Optional[str] = ""


class SendSessionReportRequest(BaseModel):
    session_id: int


class SessionNoteRequest(BaseModel):
    patient_id: int
    note: Optional[str] = ""


class ExerciseItem(BaseModel):
    id: Optional[Any] = None
    name: Optional[str] = "Exercise"
    sets: Optional[Any] = 1
    reps: Optional[Any] = 1
    intensity: Optional[str] = None
    duration: Optional[str] = None
    notes: Optional[str] = None


class AssignExercisesRequest(BaseModel):
    patient_id: int
    exercises: List[dict]
    doctor_note: Optional[str] = ""
