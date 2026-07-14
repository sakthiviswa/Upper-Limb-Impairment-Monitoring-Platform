"""
User / Dashboard / Profile / Messaging / Appointments Router
==============================================================
Consolidates everything that used to live in the separate Flask backend
(routes/user.py) into the single FastAPI backend. Routes are mounted
under the "/api" prefix in main.py, so paths on the wire are unchanged
(e.g. GET /api/user/profile) - only the transport (Flask -> FastAPI)
changed, so the frontend needed no route changes.

Requires a valid JWT (Authorization: Bearer <token>) via get_current_user.
"""

import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from database import get_db
from security import get_current_user
from models.user import User
from models.notification import Notification
from models.message import Conversation, Message
from models.exercise_assignment import ExerciseAssignment
from models.appointment import Appointment
from models.models import RehabSession, Patient as RehabPatient
from schemas_user import (
    ProfileUpdateRequest,
    DoctorProfileUpdateRequest,
    SendMessageRequest,
    CreateAppointmentRequest,
    RespondAppointmentRequest,
    SendSessionReportRequest,
    SessionNoteRequest,
    AssignExercisesRequest,
)

router = APIRouter()


def _send_notification(db: Session, recipient_id: int, sender_id: int, notif_type: str, message: str):
    n = Notification(
        recipient_id=recipient_id,
        sender_id=sender_id,
        type=notif_type,
        message=message,
    )
    db.add(n)


def _get_or_create_conversation(db: Session, user1_id: int, user2_id: int) -> Conversation:
    conv = db.query(Conversation).filter(
        or_(
            and_(Conversation.user1_id == user1_id, Conversation.user2_id == user2_id),
            and_(Conversation.user1_id == user2_id, Conversation.user2_id == user1_id),
        )
    ).first()
    if not conv:
        conv = Conversation(user1_id=user1_id, user2_id=user2_id)
        db.add(conv)
        db.flush()
    return conv


def _get_rehab_patient_by_email(db: Session, email: str):
    return db.query(RehabPatient).filter_by(email=email).first()


def _doctor_public_dict(d: User, patient_count: int) -> dict:
    return {
        "id": d.id,
        "name": d.name,
        "email": d.email,
        "specialization": d.specialization or "",
        "qualification": d.qualification or "",
        "hospital": d.hospital or "",
        "experience": d.experience,
        "rating": d.rating,
        "review_count": d.review_count,
        "location": d.location or "",
        "languages": d.languages or "",
        "consult_fee": d.consult_fee or "",
        "bio": d.bio or "",
        "availability": d.availability or "",
        "verified": d.verified or False,
        "profile_image": d.profile_image,
        "patients_count": patient_count,
    }


# PROFILE

@router.get("/user/profile")
def get_profile(me: User = Depends(get_current_user)):
    profile = {
        "id": me.id,
        "fullName": me.name,
        "email": me.email,
        "age": me.age,
        "gender": me.gender,
        "phoneNumber": me.phone_number,
        "role": me.role,
        "doctorAccepted": me.doctor_accepted,
        "assignedDoctorId": me.assigned_doctor_id,
        "selectedDoctorId": me.selected_doctor_id,
        "doctorName": me.doctor_name,
    }
    if me.role == "patient":
        profile.update({
            "injuredArm": me.injured_arm,
            "injuryType": me.injury_type,
            "injurySeverity": me.injury_severity,
            "dateOfInjury": me.date_of_injury,
            "sessionDuration": me.session_duration,
            "difficultyLevel": me.difficulty_level,
            "reminderEnabled": me.reminder_enabled,
        })
    if me.role in ("doctor", "admin"):
        profile.update({
            "specialization": me.specialization or "",
            "qualification": me.qualification or "",
            "hospital": me.hospital or "",
            "experience": me.experience,
            "rating": me.rating,
            "review_count": me.review_count,
            "location": me.location or "",
            "languages": me.languages or "",
            "consult_fee": me.consult_fee or "",
            "bio": me.bio or "",
            "availability": me.availability or "",
            "verified": me.verified or False,
            "profile_image": me.profile_image,
        })
    return profile


@router.put("/user/profile")
def update_profile(
    data: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    payload = data.model_dump(exclude_unset=True)

    if "fullName" in payload:
        me.name = (payload["fullName"] or "").strip()
    if "age" in payload:
        me.age = payload["age"]
    if "gender" in payload:
        me.gender = payload["gender"]
    if "phoneNumber" in payload:
        me.phone_number = payload["phoneNumber"]

    notified_doctor = False

    if me.role == "patient":
        if "injuredArm" in payload:
            me.injured_arm = payload["injuredArm"]
        if "injuryType" in payload:
            me.injury_type = payload["injuryType"]
        if "injurySeverity" in payload:
            me.injury_severity = payload["injurySeverity"]
        if "dateOfInjury" in payload:
            me.date_of_injury = payload["dateOfInjury"]
        if "sessionDuration" in payload:
            me.session_duration = payload["sessionDuration"]
        if "difficultyLevel" in payload:
            me.difficulty_level = payload["difficultyLevel"]
        if "reminderEnabled" in payload:
            me.reminder_enabled = payload.get("reminderEnabled", False)

        new_doctor_id = payload.get("selectedDoctorId")
        if new_doctor_id:
            new_doctor_id = int(new_doctor_id)
            if me.selected_doctor_id != new_doctor_id and not me.doctor_accepted:
                doctor = db.query(User).filter_by(id=new_doctor_id, role="doctor").first()
                if not doctor:
                    raise HTTPException(404, "Selected doctor not found")
                # Only allow selection of doctors who are verified
                if not doctor.verified:
                    raise HTTPException(422, "Doctor is not verified")

                me.selected_doctor_id = new_doctor_id
                old_requests = db.query(Notification).filter_by(
                    sender_id=me.id, type="doctor_request", is_read=False,
                ).all()
                for old in old_requests:
                    db.delete(old)

                _send_notification(
                    db,
                    recipient_id=new_doctor_id,
                    sender_id=me.id,
                    notif_type="doctor_request",
                    message=(
                        f"{me.name} has selected you as their doctor and is "
                        f"requesting your care. "
                        f"Injury: {me.injury_type or 'N/A'}, "
                        f"Severity: {me.injury_severity or 'N/A'}."
                    ),
                )
                notified_doctor = True

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to update profile: {str(e)}")

    return {
        "message": "Profile updated successfully",
        "notifiedDoctor": notified_doctor,
        "profile": me.to_dict(),
    }


# DOCTORS LIST

@router.get("/doctors")
def list_doctors(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    doctors = db.query(User).filter_by(role="doctor").all()
    result = []
    for d in doctors:
        patient_count = db.query(User).filter_by(
            role="patient", assigned_doctor_id=d.id, doctor_accepted=True
        ).count()
        result.append(_doctor_public_dict(d, patient_count))
    return {"doctors": result}


@router.get("/doctor/profile/{doctor_id}")
def get_doctor_profile(doctor_id: int, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    doctor = db.query(User).filter_by(id=doctor_id, role="doctor").first()
    if not doctor:
        raise HTTPException(404, "Doctor not found")

    patient_count = db.query(User).filter_by(
        role="patient", assigned_doctor_id=doctor.id, doctor_accepted=True
    ).count()

    return _doctor_public_dict(doctor, patient_count)


@router.put("/doctor/profile")
def update_doctor_profile(
    data: DoctorProfileUpdateRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if me.role not in ("doctor", "admin"):
        raise HTTPException(403, "Forbidden")

    payload = data.model_dump(exclude_unset=True)

    if "fullName" in payload:
        me.name = (payload["fullName"] or "").strip()
    if "age" in payload:
        me.age = payload["age"]
    if "gender" in payload:
        me.gender = payload["gender"]
    if "phoneNumber" in payload:
        me.phone_number = payload["phoneNumber"]

    doctor_fields = [
        "specialization", "qualification", "hospital",
        "experience", "rating", "review_count",
        "location", "languages", "consult_fee",
        "bio", "availability", "profile_image",
    ]
    for field in doctor_fields:
        if field in payload:
            setattr(me, field, payload[field])

    if "verified" in payload and me.role == "admin":
        me.verified = bool(payload["verified"])

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to update doctor profile: {str(e)}")

    return {
        "message": "Doctor profile updated successfully",
        "profile": me.to_dict(),
    }


# NOTIFICATIONS

@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    notifs = (
        db.query(Notification)
        .filter_by(recipient_id=me.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    result = []
    for n in notifs:
        d = n.to_dict()
        sender = db.query(User).filter(User.id == n.sender_id).first()
        d["senderName"] = sender.name if sender else "Unknown"
        d["senderEmail"] = sender.email if sender else ""
        if n.type == "doctor_request":
            patient = db.query(User).filter(User.id == n.sender_id).first()
            if patient:
                d["patientDetails"] = {
                    "name": patient.name,
                    "email": patient.email,
                    "age": patient.age,
                    "injuryType": patient.injury_type,
                    "injurySeverity": patient.injury_severity,
                    "injuredArm": patient.injured_arm,
                }
        result.append(d)
    return {"notifications": result}


@router.post("/notifications/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    n = db.query(Notification).filter_by(id=notif_id, recipient_id=me.id).first()
    if not n:
        raise HTTPException(404, "Not found")
    n.is_read = True
    db.commit()
    return {"message": "Marked as read"}


@router.post("/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    db.query(Notification).filter_by(recipient_id=me.id, is_read=False).update({"is_read": True})
    db.commit()
    return {"message": "All marked as read"}


# DOCTOR - ACCEPT / DECLINE / PATIENT LISTS

@router.post("/doctor/accept-patient/{patient_id}")
def accept_patient(patient_id: int, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    if me.role not in ("doctor", "admin"):
        raise HTTPException(403, "Forbidden")

    patient = db.query(User).filter_by(id=patient_id, role="patient").first()
    if not patient:
        raise HTTPException(404, "Patient not found")

    patient.assigned_doctor_id = me.id
    patient.doctor_accepted = True
    patient.doctor_name = me.name

    _send_notification(
        db,
        recipient_id=patient.id,
        sender_id=me.id,
        notif_type="request_accepted",
        message=(
            f"Dr. {me.name} has accepted your request and is now your assigned doctor. "
            f"You can now message them directly."
        ),
    )

    db.query(Notification).filter_by(
        recipient_id=me.id, sender_id=patient_id, type="doctor_request", is_read=False,
    ).update({"is_read": True})

    _get_or_create_conversation(db, me.id, patient.id)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error: {str(e)}")

    return {"message": f"Patient {patient.name} accepted", "patient": patient.to_dict()}


@router.post("/doctor/decline-patient/{patient_id}")
def decline_patient(patient_id: int, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    if me.role not in ("doctor", "admin"):
        raise HTTPException(403, "Forbidden")

    patient = db.query(User).filter_by(id=patient_id, role="patient").first()
    if not patient:
        raise HTTPException(404, "Patient not found")

    patient.selected_doctor_id = None

    _send_notification(
        db,
        recipient_id=patient.id,
        sender_id=me.id,
        notif_type="request_declined",
        message=(
            f"Dr. {me.name} is currently unavailable and could not accept your request. "
            f"Please select another doctor from your profile."
        ),
    )

    db.query(Notification).filter_by(
        recipient_id=me.id, sender_id=patient_id, type="doctor_request", is_read=False,
    ).update({"is_read": True})

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error: {str(e)}")

    return {"message": "Patient declined"}


@router.get("/doctor/pending-patients")
def pending_patients(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    if me.role not in ("doctor", "admin"):
        raise HTTPException(403, "Forbidden")

    patients = (
        db.query(User)
        .filter_by(role="patient", selected_doctor_id=me.id, doctor_accepted=False)
        .all()
    )
    return {"patients": [p.to_dict() for p in patients]}


@router.get("/doctor/accepted-patients")
def accepted_patients(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    if me.role not in ("doctor", "admin"):
        raise HTTPException(403, "Forbidden")

    patients = db.query(User).filter_by(
        role="patient", assigned_doctor_id=me.id, doctor_accepted=True,
    ).all()
    return {"patients": [p.to_dict() for p in patients]}


@router.get("/doctor/my-patients")
def my_patients(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    return accepted_patients(db=db, me=me)


# MESSAGES

@router.get("/messages/conversations")
def get_conversations(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    convs = (
        db.query(Conversation)
        .filter(or_(Conversation.user1_id == me.id, Conversation.user2_id == me.id))
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    result = []
    for conv in convs:
        other_id = conv.user2_id if conv.user1_id == me.id else conv.user1_id
        other_user = db.query(User).filter(User.id == other_id).first()
        last_msg = (
            db.query(Message)
            .filter_by(conversation_id=conv.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        unread = (
            db.query(Message)
            .filter_by(conversation_id=conv.id, is_read=False)
            .filter(Message.sender_id != me.id)
            .count()
        )
        result.append({
            "id": conv.id,
            "otherName": other_user.name if other_user else "Unknown",
            "otherRole": other_user.role if other_user else "",
            "lastMessage": last_msg.content[:60] if last_msg else "",
            "updatedAt": conv.updated_at.isoformat() if conv.updated_at else None,
            "unread": unread,
        })

    return {"conversations": result}


@router.get("/messages/conversation/{conv_id}")
def get_messages(conv_id: int, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(404, "Not found")

    if me.id not in (conv.user1_id, conv.user2_id):
        raise HTTPException(403, "Forbidden")

    messages = (
        db.query(Message)
        .filter_by(conversation_id=conv_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return {"messages": [m.to_dict() for m in messages]}


@router.post("/messages/send")
def send_message(data: SendMessageRequest, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    content = (data.content or "").strip()
    conv_id = data.conversationId

    if not content:
        raise HTTPException(400, "Message cannot be empty.")
    if not conv_id:
        raise HTTPException(400, "conversationId is required.")

    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(404, "Not found")
    if me.id not in (conv.user1_id, conv.user2_id):
        raise HTTPException(403, "Forbidden")

    msg = Message(conversation_id=conv_id, sender_id=me.id, content=content)
    conv.updated_at = datetime.now(timezone.utc)
    db.add(msg)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error: {str(e)}")

    db.refresh(msg)
    return {"message": "Sent", "id": msg.id}


@router.post("/messages/conversation/{conv_id}/read")
def mark_conversation_read(conv_id: int, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(404, "Not found")

    if me.id not in (conv.user1_id, conv.user2_id):
        raise HTTPException(403, "Forbidden")

    db.query(Message).filter_by(
        conversation_id=conv_id, is_read=False
    ).filter(Message.sender_id != me.id).update({"is_read": True})

    db.commit()
    return {"message": "Marked as read"}


# APPOINTMENTS

def _appointment_to_response(db: Session, appt: Appointment):
    patient = db.query(User).filter(User.id == appt.patient_id).first() if appt.patient_id else None
    doctor = db.query(User).filter(User.id == appt.doctor_id).first() if appt.doctor_id else None
    return appt.to_dict(
        patient_name=patient.name if patient else None,
        doctor_name=doctor.name if doctor else None,
    )


@router.get("/appointments")
def list_appointments(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    if me.role == "patient":
        q = db.query(Appointment).filter_by(patient_id=me.id)
    elif me.role in ("doctor", "admin"):
        q = db.query(Appointment).filter_by(doctor_id=me.id)
    else:
        raise HTTPException(403, "Forbidden")
    appts = q.order_by(Appointment.appointment_date.desc()).all()
    return {
        "appointments": [_appointment_to_response(db, a) for a in appts],
        "total": len(appts),
    }


@router.post("/appointments", status_code=201)
def create_appointment(
    data: CreateAppointmentRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if me.role != "patient":
        raise HTTPException(403, "Forbidden")

    doctor = db.query(User).filter_by(id=int(data.doctor_id), role="doctor").first()
    if not doctor:
        raise HTTPException(404, "Doctor not found")

    appt_type = (data.type or "online").lower()
    if appt_type not in ("online", "offline"):
        raise HTTPException(422, "type must be online or offline")
    if appt_type == "offline" and not (data.location or "").strip():
        raise HTTPException(422, "Location is required for offline appointments")

    try:
        dt = datetime.fromisoformat(data.appointment_date.replace("Z", "+00:00"))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(422, "Invalid appointment_date format")

    duration_mins = int(data.duration_mins or 30)
    meet_link = None
    if appt_type == "online":
        code = uuid.uuid4().hex[:10]
        meet_link = f"https://meet.google.com/{code[:3]}-{code[3:7]}-{code[7:10]}"

    appt = Appointment(
        patient_id=me.id,
        doctor_id=doctor.id,
        appointment_date=dt,
        duration_mins=duration_mins,
        type=appt_type,
        reason=(data.reason or "").strip(),
        location=(data.location or "").strip() or None,
        meet_link=meet_link,
        status="pending",
    )
    db.add(appt)
    db.flush()

    type_label = "online" if appt_type == "online" else "in-clinic"
    _send_notification(
        db,
        recipient_id=doctor.id,
        sender_id=me.id,
        notif_type="doctor_request",
        message=f"{me.name} has requested a {type_label} appointment on {dt.strftime('%b %d, %Y at %H:%M UTC')}.",
    )
    db.commit()
    db.refresh(appt)
    return _appointment_to_response(db, appt)


@router.post("/appointments/{appt_id}/respond")
def respond_appointment(
    appt_id: int,
    data: RespondAppointmentRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if me.role not in ("doctor", "admin"):
        raise HTTPException(403, "Forbidden")

    status_val = (data.status or "").lower()
    if status_val not in ("confirmed", "declined"):
        raise HTTPException(422, "status must be confirmed or declined")

    appt = db.query(Appointment).filter_by(id=appt_id, doctor_id=me.id).first()
    if not appt:
        raise HTTPException(404, "Appointment not found")
    if appt.status != "pending":
        raise HTTPException(400, "Appointment already responded to")

    appt.status = status_val
    appt.updated_at = datetime.now(timezone.utc)
    date_str = appt.appointment_date.strftime("%b %d, %Y at %H:%M UTC")
    type_label = "online" if appt.type == "online" else "in-clinic"

    if status_val == "confirmed":
        msg = f"Dr. {me.name} has confirmed your {type_label} appointment on {date_str}."
        if appt.meet_link:
            msg += " Google Meet link is ready."
        notif_type = "request_accepted"
    else:
        msg = f"Dr. {me.name} has declined your appointment request. Please book another time."
        notif_type = "request_declined"

    _send_notification(db, recipient_id=appt.patient_id, sender_id=me.id, notif_type=notif_type, message=msg)
    db.commit()
    db.refresh(appt)
    return _appointment_to_response(db, appt)


@router.delete("/appointments/{appt_id}", status_code=204)
def cancel_appointment_route(appt_id: int, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    if me.role == "patient":
        appt = db.query(Appointment).filter_by(id=appt_id, patient_id=me.id).first()
    else:
        appt = db.query(Appointment).filter_by(id=appt_id, doctor_id=me.id).first()
    if not appt:
        raise HTTPException(404, "Appointment not found")
    if appt.status in ("completed", "cancelled"):
        raise HTTPException(400, "Cannot cancel this appointment")

    appt.status = "cancelled"
    appt.updated_at = datetime.now(timezone.utc)
    other_id = appt.doctor_id if me.role == "patient" else appt.patient_id
    _send_notification(
        db,
        recipient_id=other_id,
        sender_id=me.id,
        notif_type="request_declined",
        message=f"{me.name} has cancelled the appointment on {appt.appointment_date.strftime('%b %d, %Y at %H:%M UTC')}.",
    )
    db.commit()
    return None


# DASHBOARDS

@router.get("/patient/dashboard")
def patient_dashboard(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    if me.role != "patient":
        raise HTTPException(403, "Forbidden")

    unread_notif = db.query(Notification).filter_by(recipient_id=me.id, is_read=False).count()

    user_convs = db.query(Conversation).filter(
        or_(Conversation.user1_id == me.id, Conversation.user2_id == me.id)
    ).all()
    unread_msgs = sum(
        db.query(Message).filter_by(conversation_id=c.id, is_read=False)
        .filter(Message.sender_id != me.id).count()
        for c in user_convs
    )

    assigned_doctor_email = None
    assigned_doctor_name = me.doctor_name
    if me.assigned_doctor_id:
        doctor = db.query(User).filter(User.id == me.assigned_doctor_id).first()
        if doctor:
            assigned_doctor_email = doctor.email
            assigned_doctor_name = doctor.name

    data = {
        "appointments": [],
        "prescriptions": 2,
        "health_score": 85,
        "unread_notifications": unread_notif,
        "unread_messages": unread_msgs,
        "doctor_accepted": me.doctor_accepted,
        "assigned_doctor_id": me.assigned_doctor_id,
        "assigned_doctor": assigned_doctor_name,
        "assigned_doctor_email": assigned_doctor_email,
    }
    return {"data": data}


@router.get("/doctor/dashboard")
def doctor_dashboard(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    if me.role not in ("doctor", "admin"):
        raise HTTPException(403, "Forbidden")

    pending_count = db.query(User).filter_by(
        role="patient", selected_doctor_id=me.id, doctor_accepted=False,
    ).count()

    accepted_count = db.query(User).filter_by(
        role="patient", assigned_doctor_id=me.id, doctor_accepted=True,
    ).count()

    unread_notif = db.query(Notification).filter_by(recipient_id=me.id, is_read=False).count()

    user_convs = db.query(Conversation).filter(
        or_(Conversation.user1_id == me.id, Conversation.user2_id == me.id)
    ).all()
    unread_msgs = sum(
        db.query(Message).filter_by(conversation_id=c.id, is_read=False)
        .filter(Message.sender_id != me.id).count()
        for c in user_convs
    )

    data = {
        "today_patients": accepted_count,
        "pending_reviews": pending_count,
        "unread_notifications": unread_notif,
        "unread_messages": unread_msgs,
        "schedule": [
            {"time": "09:00", "patient": "John Doe", "type": "Check-up"},
            {"time": "10:30", "patient": "Jane Smith", "type": "Follow-up"},
            {"time": "14:00", "patient": "Bob Wilson", "type": "Consultation"},
        ],
    }
    return {"data": data}


@router.get("/admin/dashboard")
def admin_dashboard(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    if me.role != "admin":
        raise HTTPException(403, "Forbidden")

    total_users = db.query(User).count()
    patients = db.query(User).filter_by(role="patient").count()
    doctors = db.query(User).filter_by(role="doctor").count()
    admins = db.query(User).filter_by(role="admin").count()
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(10).all()

    data = {
        "stats": {
            "total_users": total_users,
            "patients": patients,
            "doctors": doctors,
            "admins": admins,
        },
        "recent_users": [u.to_dict() for u in recent_users],
    }
    return {"data": data}


# PATIENT: Send session report to doctor

@router.post("/patient/send-session-report")
def send_session_report(
    data: SendSessionReportRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if me.role != "patient":
        raise HTTPException(403, "Forbidden")

    session_id = data.session_id
    if not session_id:
        raise HTTPException(400, "session_id is required")
    if not me.assigned_doctor_id:
        raise HTTPException(400, "You have no assigned doctor yet")

    rehab_patient = _get_rehab_patient_by_email(db, me.email)
    if not rehab_patient:
        raise HTTPException(404, "Rehab profile not found")

    rehab_session = db.query(RehabSession).filter_by(id=session_id, patient_id=rehab_patient.id).first()
    if not rehab_session:
        raise HTTPException(404, "Session not found or does not belong to you")

    session_data = rehab_session.to_dict()

    doctor = db.query(User).filter(User.id == me.assigned_doctor_id).first()
    if not doctor:
        raise HTTPException(404, "Assigned doctor not found")

    _send_notification(
        db,
        recipient_id=doctor.id,
        sender_id=me.id,
        notif_type="report_ready",
        message=(
            f"{me.name} has sent Session #{session_id} for your review. "
            f"Avg angle: {session_data['avg_angle']} deg, "
            f"Status: {session_data['injury_status']}."
        ),
    )

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error: {str(e)}")

    return {"message": "Report sent to your doctor successfully"}


# PATIENT: View assigned exercises

@router.get("/patient/my-exercises")
def get_my_exercises(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    if me.role != "patient":
        raise HTTPException(403, "Forbidden")

    assignments = (
        db.query(ExerciseAssignment)
        .filter_by(patient_id=me.id)
        .order_by(ExerciseAssignment.created_at.desc())
        .limit(10)
        .all()
    )
    return {"assignments": [a.to_dict() for a in assignments]}


# DOCTOR: Get a patient's rehab sessions (Report Analysis panel)

@router.get("/doctor/patient-sessions/{patient_id}")
def get_patient_sessions(patient_id: int, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    if me.role not in ("doctor", "admin"):
        raise HTTPException(403, "Forbidden")

    patient = db.query(User).filter_by(
        id=patient_id, role="patient", assigned_doctor_id=me.id, doctor_accepted=True,
    ).first()
    if not patient:
        raise HTTPException(403, "Patient not assigned to you")

    rehab_patient = _get_rehab_patient_by_email(db, patient.email)
    if not rehab_patient:
        return {"sessions": []}

    sessions = (
        db.query(RehabSession)
        .filter_by(patient_id=rehab_patient.id)
        .order_by(RehabSession.created_at.desc())
        .all()
    )
    return {"sessions": [s.to_dict() for s in sessions]}


# DOCTOR: Save analysis note on a session

@router.post("/doctor/session-note/{session_id}")
def save_session_note(
    session_id: int,
    data: SessionNoteRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if me.role not in ("doctor", "admin"):
        raise HTTPException(403, "Forbidden")

    patient_id = data.patient_id
    note = (data.note or "").strip()
    if not patient_id:
        raise HTTPException(400, "patient_id is required")

    patient = db.query(User).filter_by(
        id=patient_id, role="patient", assigned_doctor_id=me.id, doctor_accepted=True,
    ).first()
    if not patient:
        raise HTTPException(403, "Patient not assigned to you")

    rehab_patient = _get_rehab_patient_by_email(db, patient.email)
    if not rehab_patient:
        raise HTTPException(404, "Rehab patient record not found")

    rehab_session = db.query(RehabSession).filter_by(id=session_id, patient_id=rehab_patient.id).first()
    if not rehab_session:
        raise HTTPException(404, "Session not found or does not belong to this patient")

    try:
        rehab_session.doctor_notes = note
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error saving note: {str(e)}")

    return {"message": "Note saved successfully"}


# DOCTOR: Assign exercises to a patient

@router.post("/doctor/assign-exercises", status_code=201)
def assign_exercises(
    data: AssignExercisesRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if me.role not in ("doctor", "admin"):
        raise HTTPException(403, "Forbidden")

    patient_id = data.patient_id
    exercises = data.exercises or []
    doctor_note = (data.doctor_note or "").strip()

    if not patient_id:
        raise HTTPException(400, "patient_id is required")
    if not exercises:
        raise HTTPException(400, "At least one exercise is required")

    patient = db.query(User).filter_by(
        id=patient_id, role="patient", assigned_doctor_id=me.id, doctor_accepted=True,
    ).first()
    if not patient:
        raise HTTPException(403, "Patient not assigned to you")

    assignment = ExerciseAssignment(
        doctor_id=me.id,
        patient_id=patient_id,
        exercises=exercises,
        doctor_note=doctor_note,
    )
    db.add(assignment)

    ex_names = ", ".join(e.get("name", "exercise") for e in exercises[:3])
    suffix = f" and {len(exercises) - 3} more" if len(exercises) > 3 else ""

    _send_notification(
        db,
        recipient_id=patient_id,
        sender_id=me.id,
        notif_type="exercise_assigned",
        message=(
            f"Dr. {me.name} has assigned you {len(exercises)} exercise(s): "
            f"{ex_names}{suffix}. Check your exercise plan."
        ),
    )

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error: {str(e)}")

    db.refresh(assignment)
    return {
        "message": "Exercises assigned successfully",
        "assignment_id": assignment.id,
        "count": len(exercises),
    }


# DOCTOR: Serve rehab session graphs (angle-vs-time & progress charts)

@router.get("/doctor/session-graph/{session_id}/{graph_type}")
def get_session_graph(
    session_id: int,
    graph_type: str,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if graph_type not in ("angle", "progress"):
        raise HTTPException(400, "Invalid graph type")

    if me.role not in ("doctor", "admin"):
        raise HTTPException(403, "Forbidden")

    rehab_session = db.query(RehabSession).filter_by(id=session_id).first()
    if not rehab_session:
        raise HTTPException(404, "Session not found")

    rehab_patient = db.query(RehabPatient).filter_by(id=rehab_session.patient_id).first()
    if not rehab_patient:
        raise HTTPException(404, "Patient not found")

    flask_patient = db.query(User).filter_by(
        email=rehab_patient.email, role="patient", assigned_doctor_id=me.id, doctor_accepted=True,
    ).first()
    if not flask_patient:
        raise HTTPException(403, "Patient not assigned to you")

    graph_path = rehab_session.graph_path if graph_type == "angle" else rehab_session.progress_path

    if not graph_path or not os.path.isfile(graph_path):
        raise HTTPException(404, "Graph not available")

    return FileResponse(graph_path, media_type="image/png")
