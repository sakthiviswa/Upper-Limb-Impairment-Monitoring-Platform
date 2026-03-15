"""
appointments.py  — FastAPI router
Mount in main.py:
    from routers.appointments import router as appointments_router
    app.include_router(appointments_router, prefix="/api", tags=["appointments"])
"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User                          # your existing User model
from models.appointment_model import Appointment, AppointmentType, AppointmentStatus
from models.notification import Notification          # your existing Notification model
from appointment_schemas import (
    AppointmentCreateRequest, AppointmentRespondRequest,
    AppointmentResponse, AppointmentListResponse,
)
from extensions import get_current_user               # your existing JWT dependency

router = APIRouter()


# ── Helpers ─────────────────────────────────────────────────────────

def _make_meet_link() -> str:
    """Generate a Google Meet-style room code (real Meet links need OAuth)."""
    code = uuid.uuid4().hex[:10]
    return f"https://meet.google.com/{code[:3]}-{code[3:7]}-{code[7:10]}"


def _appointment_to_response(appt: Appointment, db: Session) -> dict:
    d = appt.to_dict()
    patient = db.query(User).filter(User.id == appt.patient_id).first()
    doctor  = db.query(User).filter(User.id == appt.doctor_id).first()
    d["patient_name"] = patient.name if patient else None
    d["doctor_name"]  = f"Dr. {doctor.name}" if doctor else None
    return d


def _notify(db: Session, user_id: int, notif_type: str, message: str,
            sender_id: int = None, extra: dict = None):
    """Create a Notification row (mirrors your existing notification pattern)."""
    notif = Notification(
        user_id    = user_id,
        type       = notif_type,
        message    = message,
        sender_id  = sender_id,
        extra_data = extra or {},
        is_read    = False,
        created_at = datetime.now(timezone.utc),
    )
    db.add(notif)


# ── Routes ───────────────────────────────────────────────────────────

@router.post("/appointments", response_model=AppointmentResponse, status_code=201)
def book_appointment(
    body: AppointmentCreateRequest,
    db:   Session     = Depends(get_db),
    me:   User        = Depends(get_current_user),
):
    """Patient books an appointment with their assigned doctor."""
    if me.role != "patient":
        raise HTTPException(403, "Only patients can book appointments.")

    doctor = db.query(User).filter(User.id == body.doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(404, "Doctor not found.")

    if body.type == AppointmentType.OFFLINE and not body.location:
        raise HTTPException(422, "Location is required for offline appointments.")

    meet_link = _make_meet_link() if body.type == AppointmentType.ONLINE else None

    appt = Appointment(
        patient_id       = me.id,
        doctor_id        = body.doctor_id,
        appointment_date = body.appointment_date,
        duration_mins    = body.duration_mins,
        type             = body.type,
        reason           = body.reason,
        location         = body.location,
        meet_link        = meet_link,
        status           = AppointmentStatus.PENDING,
    )
    db.add(appt)
    db.flush()   # get appt.id before notify

    # Notify doctor
    type_label = "online" if body.type == AppointmentType.ONLINE else "in-clinic"
    _notify(
        db, doctor.id,
        notif_type = "appointment_request",
        message    = (
            f"{me.name} has requested a {type_label} appointment on "
            f"{body.appointment_date.strftime('%b %d, %Y at %H:%M UTC')}."
        ),
        sender_id  = me.id,
        extra      = {
            "appointment_id":   appt.id,
            "appointment_type": body.type.value,
            "appointment_date": body.appointment_date.isoformat(),
            "duration_mins":    body.duration_mins,
            "reason":           body.reason,
            "meet_link":        meet_link,
            "location":         body.location,
            "patient_name":     me.name,
            "patient_email":    me.email,
        },
    )

    db.commit()
    db.refresh(appt)
    return _appointment_to_response(appt, db)


@router.post("/appointments/{appt_id}/respond", response_model=AppointmentResponse)
def respond_to_appointment(
    appt_id: int,
    body:    AppointmentRespondRequest,
    db:      Session = Depends(get_db),
    me:      User    = Depends(get_current_user),
):
    """Doctor confirms or declines an appointment request."""
    if me.role != "doctor":
        raise HTTPException(403, "Only doctors can respond to appointment requests.")

    appt = db.query(Appointment).filter(
        Appointment.id == appt_id, Appointment.doctor_id == me.id
    ).first()
    if not appt:
        raise HTTPException(404, "Appointment not found.")

    if appt.status != AppointmentStatus.PENDING:
        raise HTTPException(400, "Appointment already responded to.")

    appt.status       = body.status
    appt.doctor_notes = body.doctor_notes
    appt.updated_at   = datetime.now(timezone.utc)

    # Notify patient
    if body.status == AppointmentStatus.CONFIRMED:
        date_str  = appt.appointment_date.strftime("%b %d, %Y at %H:%M UTC")
        type_label = "online" if appt.type == AppointmentType.ONLINE else "in-clinic"
        msg = (
            f"Dr. {me.name} has confirmed your {type_label} appointment "
            f"on {date_str}."
        )
        if appt.meet_link:
            msg += f" Google Meet link is ready."
        notif_type = "appointment_booked"
    else:
        msg        = f"Dr. {me.name} has declined your appointment request. Please book another time."
        notif_type = "appointment_declined"

    _notify(
        db, appt.patient_id,
        notif_type = notif_type,
        message    = msg,
        sender_id  = me.id,
        extra      = {
            "appointment_id":   appt.id,
            "appointment_type": appt.type.value,
            "appointment_date": appt.appointment_date.isoformat(),
            "duration_mins":    appt.duration_mins,
            "meet_link":        appt.meet_link,
            "location":         appt.location,
            "status":           body.status.value,
            "doctor_name":      me.name,
        },
    )

    db.commit()
    db.refresh(appt)
    return _appointment_to_response(appt, db)


@router.get("/appointments", response_model=AppointmentListResponse)
def list_my_appointments(
    db: Session = Depends(get_db),
    me: User    = Depends(get_current_user),
):
    """Return all appointments for the current user (patient or doctor)."""
    if me.role == "patient":
        appts = db.query(Appointment).filter(Appointment.patient_id == me.id)\
                  .order_by(Appointment.appointment_date.desc()).all()
    else:
        appts = db.query(Appointment).filter(Appointment.doctor_id == me.id)\
                  .order_by(Appointment.appointment_date.desc()).all()

    return {
        "appointments": [_appointment_to_response(a, db) for a in appts],
        "total":        len(appts),
    }


@router.delete("/appointments/{appt_id}", status_code=204)
def cancel_appointment(
    appt_id: int,
    db:      Session = Depends(get_db),
    me:      User    = Depends(get_current_user),
):
    """Patient or doctor cancels an appointment."""
    if me.role == "patient":
        appt = db.query(Appointment).filter(
            Appointment.id == appt_id, Appointment.patient_id == me.id
        ).first()
    else:
        appt = db.query(Appointment).filter(
            Appointment.id == appt_id, Appointment.doctor_id == me.id
        ).first()

    if not appt:
        raise HTTPException(404, "Appointment not found.")
    if appt.status in (AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED):
        raise HTTPException(400, "Cannot cancel a completed or already-cancelled appointment.")

    appt.status     = AppointmentStatus.CANCELLED
    appt.updated_at = datetime.now(timezone.utc)

    # Notify the other party
    other_id = appt.doctor_id if me.role == "patient" else appt.patient_id
    _notify(
        db, other_id,
        notif_type = "appointment_cancelled",
        message    = f"{me.name} has cancelled the appointment on "
                     f"{appt.appointment_date.strftime('%b %d, %Y at %H:%M UTC')}.",
        sender_id  = me.id,
        extra      = {"appointment_id": appt.id},
    )

    db.commit()