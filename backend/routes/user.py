"""
User / Dashboard & Profile routes.

GET  /api/user/profile                              – get user profile
PUT  /api/user/profile                              – update profile + notify SELECTED doctor
GET  /api/patient/dashboard                         – patient overview
GET  /api/doctor/dashboard                          – doctor overview
GET  /api/notifications                             – get notifications for current user
POST /api/notifications/<id>/read                   – mark notification as read
POST /api/notifications/read-all                    – mark all notifications as read
POST /api/doctor/accept-patient/<patient_id>        – doctor accepts a patient
POST /api/doctor/decline-patient/<patient_id>       – doctor declines a patient
GET  /api/doctor/pending-patients                   – patients who selected this doctor
GET  /api/doctor/accepted-patients                  – patients accepted by this doctor
GET  /api/doctors                                   – list all doctors
GET  /api/messages/conversations                    – list conversations for current user
GET  /api/messages/conversation/<id>                – get messages in a conversation
POST /api/messages/send                             – send a message
POST /api/messages/conversation/<id>/read           – mark conversation messages as read

NEW:
POST /api/patient/send-session-report               – patient sends session report to doctor
GET  /api/patient/my-exercises                      – patient views assigned exercises
GET  /api/doctor/patient-sessions/<patient_id>      – doctor views patient's rehab sessions
POST /api/doctor/session-note/<session_id>          – doctor saves analysis note on session
POST /api/doctor/assign-exercises                   – doctor assigns exercises to patient

Requires JWT.
"""

from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
import os

from extensions import db
from models.user import User
from models.notification import Notification
from models.message import Conversation, Message
from models.exercise_assignment import ExerciseAssignment

# Rehab DB — separate SQLAlchemy engine/session
# SessionLocal is the session factory from your rehab database module.
# Adjust this import if your SessionLocal lives in a different file.
from database import SessionLocal
from models.models import RehabSession, Patient as RehabPatient

user_bp = Blueprint("user", __name__, url_prefix="/api")


# ── helpers ───────────────────────────────────────────────────────────────────

def _send_notification(recipient_id: int, sender_id: int, notif_type: str, message: str):
    n = Notification(
        recipient_id=recipient_id,
        sender_id=sender_id,
        type=notif_type,
        message=message,
    )
    db.session.add(n)


def _get_or_create_conversation(user1_id: int, user2_id: int) -> Conversation:
    conv = Conversation.query.filter(
        db.or_(
            db.and_(Conversation.user1_id == user1_id, Conversation.user2_id == user2_id),
            db.and_(Conversation.user1_id == user2_id, Conversation.user2_id == user1_id),
        )
    ).first()
    if not conv:
        conv = Conversation(user1_id=user1_id, user2_id=user2_id)
        db.session.add(conv)
    return conv


def _get_rehab_patient_by_email(rehab_db, email: str):
    """Look up a RehabPatient by the Flask User's email."""
    return rehab_db.query(RehabPatient).filter_by(email=email).first()


# ═══════════════════════════════════════════════════════════════════════════════
# PROFILE
# ═══════════════════════════════════════════════════════════════════════════════

@user_bp.get("/user/profile")
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    profile = {
        "id":               user.id,
        "fullName":         user.name,
        "email":            user.email,
        "age":              user.age,
        "gender":           user.gender,
        "phoneNumber":      user.phone_number,
        "role":             user.role,
        "doctorAccepted":   user.doctor_accepted,
        "assignedDoctorId": user.assigned_doctor_id,
        "selectedDoctorId": user.selected_doctor_id,
        "doctorName":       user.doctor_name,
    }
    if user.role == "patient":
        profile.update({
            "injuredArm":      user.injured_arm,
            "injuryType":      user.injury_type,
            "injurySeverity":  user.injury_severity,
            "dateOfInjury":    user.date_of_injury,
            "sessionDuration": user.session_duration,
            "difficultyLevel": user.difficulty_level,
            "reminderEnabled": user.reminder_enabled,
        })
    return jsonify(profile), 200


@user_bp.put("/user/profile")
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"message": "No JSON body provided"}), 400

    if "fullName" in data:
        user.name = (data["fullName"] or "").strip()
    if "age" in data:
        user.age = data["age"]
    if "gender" in data:
        user.gender = data["gender"]
    if "phoneNumber" in data:
        user.phone_number = data["phoneNumber"]

    notified_doctor = False

    if user.role == "patient":
        if "injuredArm" in data:
            user.injured_arm = data["injuredArm"]
        if "injuryType" in data:
            user.injury_type = data["injuryType"]
        if "injurySeverity" in data:
            user.injury_severity = data["injurySeverity"]
        if "dateOfInjury" in data:
            user.date_of_injury = data["dateOfInjury"]
        if "sessionDuration" in data:
            user.session_duration = data["sessionDuration"]
        if "difficultyLevel" in data:
            user.difficulty_level = data["difficultyLevel"]
        if "reminderEnabled" in data:
            user.reminder_enabled = data.get("reminderEnabled", False)

        new_doctor_id = data.get("selectedDoctorId")
        if new_doctor_id:
            new_doctor_id = int(new_doctor_id)
            if user.selected_doctor_id != new_doctor_id and not user.doctor_accepted:
                user.selected_doctor_id = new_doctor_id
                doctor = User.query.filter_by(id=new_doctor_id, role="doctor").first()
                if doctor:
                    old_requests = Notification.query.filter_by(
                        sender_id=user.id,
                        type="doctor_request",
                        is_read=False,
                    ).all()
                    for old in old_requests:
                        db.session.delete(old)

                    _send_notification(
                        recipient_id=new_doctor_id,
                        sender_id=user.id,
                        notif_type="doctor_request",
                        message=(
                            f"{user.name} has selected you as their doctor and is "
                            f"requesting your care. "
                            f"Injury: {user.injury_type or 'N/A'}, "
                            f"Severity: {user.injury_severity or 'N/A'}."
                        ),
                    )
                    notified_doctor = True

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update profile: {str(e)}"}), 500

    return jsonify({
        "message":        "Profile updated successfully",
        "notifiedDoctor": notified_doctor,
        "profile":        user.to_dict(),
    }), 200


# ═══════════════════════════════════════════════════════════════════════════════
# DOCTORS LIST
# ═══════════════════════════════════════════════════════════════════════════════

@user_bp.get("/doctors")
@jwt_required()
def list_doctors():
    doctors = User.query.filter_by(role="doctor").all()
    result = []
    for d in doctors:
        patient_count = User.query.filter_by(
            role="patient", assigned_doctor_id=d.id, doctor_accepted=True
        ).count()
        result.append({
            "id":             d.id,
            "name":           d.name,
            "email":          d.email,
            "specialization": getattr(d, "specialization", ""),
            "patients_count": patient_count,
        })
    return jsonify({"doctors": result}), 200


# ═══════════════════════════════════════════════════════════════════════════════
# NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════════════════

@user_bp.get("/notifications")
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    notifs = (
        Notification.query
        .filter_by(recipient_id=user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    result = []
    for n in notifs:
        d = n.to_dict()
        sender = User.query.get(n.sender_id)
        d["senderName"]  = sender.name  if sender else "Unknown"
        d["senderEmail"] = sender.email if sender else ""
        if n.type == "doctor_request":
            patient = User.query.get(n.sender_id)
            if patient:
                d["patientDetails"] = {
                    "name":           patient.name,
                    "email":          patient.email,
                    "age":            patient.age,
                    "injuryType":     patient.injury_type,
                    "injurySeverity": patient.injury_severity,
                    "injuredArm":     patient.injured_arm,
                }
        result.append(d)
    return jsonify({"notifications": result}), 200


@user_bp.post("/notifications/<int:notif_id>/read")
@jwt_required()
def mark_read(notif_id):
    user_id = get_jwt_identity()
    n = Notification.query.filter_by(id=notif_id, recipient_id=user_id).first()
    if not n:
        return jsonify({"message": "Not found"}), 404
    n.is_read = True
    db.session.commit()
    return jsonify({"message": "Marked as read"}), 200


@user_bp.post("/notifications/read-all")
@jwt_required()
def mark_all_read():
    user_id = get_jwt_identity()
    Notification.query.filter_by(recipient_id=user_id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "All marked as read"}), 200


# ═══════════════════════════════════════════════════════════════════════════════
# DOCTOR — ACCEPT / DECLINE / PATIENT LISTS
# ═══════════════════════════════════════════════════════════════════════════════

@user_bp.post("/doctor/accept-patient/<int:patient_id>")
@jwt_required()
def accept_patient(patient_id):
    doctor_id = get_jwt_identity()
    doctor = User.query.get(doctor_id)
    if not doctor or doctor.role not in ("doctor", "admin"):
        return jsonify({"message": "Forbidden"}), 403

    patient = User.query.filter_by(id=patient_id, role="patient").first()
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    patient.assigned_doctor_id = doctor.id
    patient.doctor_accepted    = True
    patient.doctor_name        = doctor.name

    _send_notification(
        recipient_id=patient.id,
        sender_id=doctor.id,
        notif_type="request_accepted",
        message=(
            f"Dr. {doctor.name} has accepted your request and is now your assigned doctor. "
            f"You can now message them directly."
        ),
    )

    Notification.query.filter_by(
        recipient_id=doctor_id,
        sender_id=patient_id,
        type="doctor_request",
        is_read=False,
    ).update({"is_read": True})

    _get_or_create_conversation(doctor.id, patient.id)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500

    return jsonify({
        "message": f"Patient {patient.name} accepted",
        "patient": patient.to_dict(),
    }), 200


@user_bp.post("/doctor/decline-patient/<int:patient_id>")
@jwt_required()
def decline_patient(patient_id):
    doctor_id = get_jwt_identity()
    doctor = User.query.get(doctor_id)
    if not doctor or doctor.role not in ("doctor", "admin"):
        return jsonify({"message": "Forbidden"}), 403

    patient = User.query.filter_by(id=patient_id, role="patient").first()
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    patient.selected_doctor_id = None

    _send_notification(
        recipient_id=patient.id,
        sender_id=doctor.id,
        notif_type="request_declined",
        message=(
            f"Dr. {doctor.name} is currently unavailable and could not accept your request. "
            f"Please select another doctor from your profile."
        ),
    )

    Notification.query.filter_by(
        recipient_id=doctor_id,
        sender_id=patient_id,
        type="doctor_request",
        is_read=False,
    ).update({"is_read": True})

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500

    return jsonify({"message": "Patient declined"}), 200


@user_bp.get("/doctor/pending-patients")
@jwt_required()
def pending_patients():
    doctor_id = get_jwt_identity()
    doctor = User.query.get(doctor_id)
    if not doctor or doctor.role not in ("doctor", "admin"):
        return jsonify({"message": "Forbidden"}), 403

    patients = (
        User.query
        .filter_by(role="patient", selected_doctor_id=int(doctor_id), doctor_accepted=False)
        .all()
    )
    return jsonify({"patients": [p.to_dict() for p in patients]}), 200


@user_bp.get("/doctor/accepted-patients")
@jwt_required()
def accepted_patients():
    doctor_id = get_jwt_identity()
    doctor = User.query.get(doctor_id)
    if not doctor or doctor.role not in ("doctor", "admin"):
        return jsonify({"message": "Forbidden"}), 403

    patients = User.query.filter_by(
        role="patient",
        assigned_doctor_id=int(doctor_id),
        doctor_accepted=True,
    ).all()
    return jsonify({"patients": [p.to_dict() for p in patients]}), 200


@user_bp.get("/doctor/my-patients")
@jwt_required()
def my_patients():
    return accepted_patients()


# ═══════════════════════════════════════════════════════════════════════════════
# MESSAGES
# ═══════════════════════════════════════════════════════════════════════════════

@user_bp.get("/messages/conversations")
@jwt_required()
def get_conversations():
    user_id = int(get_jwt_identity())
    convs = (
        Conversation.query
        .filter(
            db.or_(
                Conversation.user1_id == user_id,
                Conversation.user2_id == user_id,
            )
        )
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    result = []
    for conv in convs:
        other_id   = conv.user2_id if conv.user1_id == user_id else conv.user1_id
        other_user = User.query.get(other_id)
        last_msg   = (
            Message.query
            .filter_by(conversation_id=conv.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        unread = (
            Message.query
            .filter_by(conversation_id=conv.id, is_read=False)
            .filter(Message.sender_id != user_id)
            .count()
        )
        result.append({
            "id":          conv.id,
            "otherName":   other_user.name  if other_user else "Unknown",
            "otherRole":   other_user.role  if other_user else "",
            "lastMessage": last_msg.content[:60] if last_msg else "",
            "updatedAt":   conv.updated_at.isoformat(),
            "unread":      unread,
        })

    return jsonify({"conversations": result}), 200


@user_bp.get("/messages/conversation/<int:conv_id>")
@jwt_required()
def get_messages(conv_id):
    user_id = int(get_jwt_identity())
    conv = Conversation.query.get_or_404(conv_id)

    if user_id not in (conv.user1_id, conv.user2_id):
        return jsonify({"message": "Forbidden"}), 403

    messages = (
        Message.query
        .filter_by(conversation_id=conv_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return jsonify({"messages": [m.to_dict() for m in messages]}), 200


@user_bp.post("/messages/send")
@jwt_required()
def send_message():
    user_id = int(get_jwt_identity())
    data    = request.get_json() or {}
    conv_id = data.get("conversationId")
    content = (data.get("content") or "").strip()

    if not content:
        return jsonify({"message": "Message cannot be empty."}), 400
    if not conv_id:
        return jsonify({"message": "conversationId is required."}), 400

    conv = Conversation.query.get_or_404(conv_id)
    if user_id not in (conv.user1_id, conv.user2_id):
        return jsonify({"message": "Forbidden"}), 403

    msg = Message(conversation_id=conv_id, sender_id=user_id, content=content)
    conv.updated_at = datetime.now(timezone.utc)
    db.session.add(msg)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500

    return jsonify({"message": "Sent", "id": msg.id}), 201


@user_bp.post("/messages/conversation/<int:conv_id>/read")
@jwt_required()
def mark_conversation_read(conv_id):
    user_id = int(get_jwt_identity())
    conv = Conversation.query.get_or_404(conv_id)

    if user_id not in (conv.user1_id, conv.user2_id):
        return jsonify({"message": "Forbidden"}), 403

    Message.query.filter_by(
        conversation_id=conv_id, is_read=False
    ).filter(Message.sender_id != user_id).update({"is_read": True})

    db.session.commit()
    return jsonify({"message": "Marked as read"}), 200


# ═══════════════════════════════════════════════════════════════════════════════
# DASHBOARDS
# ═══════════════════════════════════════════════════════════════════════════════

@user_bp.get("/patient/dashboard")
@jwt_required()
def patient_dashboard():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role != "patient":
        return jsonify({"message": "Forbidden"}), 403

    unread_notif = Notification.query.filter_by(
        recipient_id=user_id, is_read=False
    ).count()

    user_convs = Conversation.query.filter(
        db.or_(
            Conversation.user1_id == int(user_id),
            Conversation.user2_id == int(user_id),
        )
    ).all()
    unread_msgs = sum(
        Message.query.filter_by(conversation_id=c.id, is_read=False)
        .filter(Message.sender_id != int(user_id)).count()
        for c in user_convs
    )

    # Resolve assigned doctor email for SendReportButton
    assigned_doctor_email = None
    if user.assigned_doctor_id:
        doctor = User.query.get(user.assigned_doctor_id)
        assigned_doctor_email = doctor.email if doctor else None

    data = {
        "appointments": [
            {"id": 1, "doctor": "Dr. Smith", "date": "2025-03-15", "status": "Confirmed"},
            {"id": 2, "doctor": "Dr. Jones", "date": "2025-03-22", "status": "Pending"},
        ],
        "prescriptions":          2,
        "health_score":           85,
        "unread_notifications":   unread_notif,
        "unread_messages":        unread_msgs,
        "doctor_accepted":        user.doctor_accepted,
        "assigned_doctor":        user.doctor_name,
        "assigned_doctor_email":  assigned_doctor_email,   # ← NEW: used by SendReportButton
    }
    return jsonify({"data": data}), 200


@user_bp.get("/doctor/dashboard")
@jwt_required()
def doctor_dashboard():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role not in ("doctor", "admin"):
        return jsonify({"message": "Forbidden"}), 403

    pending_count = User.query.filter_by(
        role="patient",
        selected_doctor_id=int(user_id),
        doctor_accepted=False,
    ).count()

    accepted_count = User.query.filter_by(
        role="patient",
        assigned_doctor_id=int(user_id),
        doctor_accepted=True,
    ).count()

    unread_notif = Notification.query.filter_by(
        recipient_id=user_id, is_read=False
    ).count()

    user_convs = Conversation.query.filter(
        db.or_(
            Conversation.user1_id == int(user_id),
            Conversation.user2_id == int(user_id),
        )
    ).all()
    unread_msgs = sum(
        Message.query.filter_by(conversation_id=c.id, is_read=False)
        .filter(Message.sender_id != int(user_id)).count()
        for c in user_convs
    )

    data = {
        "today_patients":       accepted_count,
        "pending_reviews":      pending_count,
        "unread_notifications": unread_notif,
        "unread_messages":      unread_msgs,
        "schedule": [
            {"time": "09:00", "patient": "John Doe",   "type": "Check-up"},
            {"time": "10:30", "patient": "Jane Smith",  "type": "Follow-up"},
            {"time": "14:00", "patient": "Bob Wilson",  "type": "Consultation"},
        ],
    }
    return jsonify({"data": data}), 200


@user_bp.get("/admin/dashboard")
@jwt_required()
def admin_dashboard():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role != "admin":
        return jsonify({"message": "Forbidden"}), 403

    total_users  = User.query.count()
    patients     = User.query.filter_by(role="patient").count()
    doctors      = User.query.filter_by(role="doctor").count()
    admins       = User.query.filter_by(role="admin").count()
    recent_users = User.query.order_by(User.created_at.desc()).limit(10).all()

    data = {
        "stats": {
            "total_users": total_users,
            "patients":    patients,
            "doctors":     doctors,
            "admins":      admins,
        },
        "recent_users": [u.to_dict() for u in recent_users],
    }
    return jsonify({"data": data}), 200


# ═══════════════════════════════════════════════════════════════════════════════
# NEW — PATIENT: Send session report to doctor
# ═══════════════════════════════════════════════════════════════════════════════

@user_bp.post("/patient/send-session-report")
@jwt_required()
def send_session_report():
    """
    Patient clicks "Send to Doctor" from SessionHistory.
    Looks up the rehab session, verifies ownership, notifies the doctor.
    """
    user_id = int(get_jwt_identity())
    patient = User.query.get(user_id)
    if not patient or patient.role != "patient":
        return jsonify({"message": "Forbidden"}), 403

    data       = request.get_json() or {}
    session_id = data.get("session_id")

    if not session_id:
        return jsonify({"message": "session_id is required"}), 400

    if not patient.assigned_doctor_id:
        return jsonify({"message": "You have no assigned doctor yet"}), 400

    # Look up session in the rehab DB
    rehab_db = SessionLocal()
    try:
        rehab_patient = _get_rehab_patient_by_email(rehab_db, patient.email)
        if not rehab_patient:
            return jsonify({"message": "Rehab profile not found"}), 404

        rehab_session = rehab_db.query(RehabSession).filter_by(
            id=session_id,
            patient_id=rehab_patient.id,
        ).first()
        if not rehab_session:
            return jsonify({"message": "Session not found or does not belong to you"}), 404

        session_data = rehab_session.to_dict()
    finally:
        rehab_db.close()

    doctor = User.query.get(patient.assigned_doctor_id)
    if not doctor:
        return jsonify({"message": "Assigned doctor not found"}), 404

    _send_notification(
        recipient_id=doctor.id,
        sender_id=patient.id,
        notif_type="report_ready",
        message=(
            f"{patient.name} has sent Session #{session_id} for your review. "
            f"Avg angle: {session_data['avg_angle']}°, "
            f"Status: {session_data['injury_status']}."
        ),
    )

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500

    return jsonify({"message": "Report sent to your doctor successfully"}), 200


# ═══════════════════════════════════════════════════════════════════════════════
# NEW — PATIENT: View assigned exercises
# ═══════════════════════════════════════════════════════════════════════════════

@user_bp.get("/patient/my-exercises")
@jwt_required()
def get_my_exercises():
    """Patient views exercises assigned by their doctor."""
    user_id = int(get_jwt_identity())
    patient = User.query.get(user_id)
    if not patient or patient.role != "patient":
        return jsonify({"message": "Forbidden"}), 403

    assignments = (
        ExerciseAssignment.query
        .filter_by(patient_id=user_id)
        .order_by(ExerciseAssignment.created_at.desc())
        .limit(10)
        .all()
    )
    return jsonify({"assignments": [a.to_dict() for a in assignments]}), 200


# ═══════════════════════════════════════════════════════════════════════════════
# NEW — DOCTOR: Get a patient's rehab sessions (Report Analysis panel)
# ═══════════════════════════════════════════════════════════════════════════════

@user_bp.get("/doctor/patient-sessions/<int:patient_id>")
@jwt_required()
def get_patient_sessions(patient_id):
    """
    Doctor selects a patient in the Report Analysis sub-tab.
    Returns all their rehab sessions from the rehab DB.
    """
    doctor_id = int(get_jwt_identity())
    doctor = User.query.get(doctor_id)
    if not doctor or doctor.role not in ("doctor", "admin"):
        return jsonify({"message": "Forbidden"}), 403

    # Security: confirm this patient is assigned to this doctor
    patient = User.query.filter_by(
        id=patient_id,
        role="patient",
        assigned_doctor_id=doctor_id,
        doctor_accepted=True,
    ).first()
    if not patient:
        return jsonify({"message": "Patient not assigned to you"}), 403

    rehab_db = SessionLocal()
    try:
        rehab_patient = _get_rehab_patient_by_email(rehab_db, patient.email)
        if not rehab_patient:
            return jsonify({"sessions": []}), 200

        sessions = (
            rehab_db.query(RehabSession)
            .filter_by(patient_id=rehab_patient.id)
            .order_by(RehabSession.created_at.desc())
            .all()
        )
        sessions_data = [s.to_dict() for s in sessions]
    finally:
        rehab_db.close()

    return jsonify({"sessions": sessions_data}), 200


# ═══════════════════════════════════════════════════════════════════════════════
# NEW — DOCTOR: Save analysis note on a session
# ═══════════════════════════════════════════════════════════════════════════════

@user_bp.post("/doctor/session-note/<int:session_id>")
@jwt_required()
def save_session_note(session_id):
    """
    Doctor writes a clinical note on a specific rehab session.
    Writes to RehabSession.doctor_notes (existing field).
    """
    doctor_id = int(get_jwt_identity())
    doctor = User.query.get(doctor_id)
    if not doctor or doctor.role not in ("doctor", "admin"):
        return jsonify({"message": "Forbidden"}), 403

    data       = request.get_json() or {}
    patient_id = data.get("patient_id")
    note       = (data.get("note") or "").strip()

    if not patient_id:
        return jsonify({"message": "patient_id is required"}), 400

    # Security: confirm patient is assigned to this doctor
    patient = User.query.filter_by(
        id=patient_id,
        role="patient",
        assigned_doctor_id=doctor_id,
        doctor_accepted=True,
    ).first()
    if not patient:
        return jsonify({"message": "Patient not assigned to you"}), 403

    rehab_db = SessionLocal()
    try:
        rehab_patient = _get_rehab_patient_by_email(rehab_db, patient.email)
        if not rehab_patient:
            return jsonify({"message": "Rehab patient record not found"}), 404

        rehab_session = rehab_db.query(RehabSession).filter_by(
            id=session_id,
            patient_id=rehab_patient.id,
        ).first()
        if not rehab_session:
            return jsonify({"message": "Session not found or does not belong to this patient"}), 404

        rehab_session.doctor_notes = note
        rehab_db.commit()
    except Exception as e:
        rehab_db.rollback()
        return jsonify({"message": f"Error saving note: {str(e)}"}), 500
    finally:
        rehab_db.close()

    return jsonify({"message": "Note saved successfully"}), 200


# ═══════════════════════════════════════════════════════════════════════════════
# NEW — DOCTOR: Assign exercises to a patient
# ═══════════════════════════════════════════════════════════════════════════════

@user_bp.post("/doctor/assign-exercises")
@jwt_required()
def assign_exercises():
    """
    Doctor prescribes exercises to an accepted patient.
    Stores assignment and notifies the patient.
    """
    doctor_id = int(get_jwt_identity())
    doctor = User.query.get(doctor_id)
    if not doctor or doctor.role not in ("doctor", "admin"):
        return jsonify({"message": "Forbidden"}), 403

    data        = request.get_json() or {}
    patient_id  = data.get("patient_id")
    exercises   = data.get("exercises", [])
    doctor_note = (data.get("doctor_note") or "").strip()

    if not patient_id:
        return jsonify({"message": "patient_id is required"}), 400
    if not exercises:
        return jsonify({"message": "At least one exercise is required"}), 400

    # Security: confirm patient is assigned to this doctor
    patient = User.query.filter_by(
        id=patient_id,
        role="patient",
        assigned_doctor_id=doctor_id,
        doctor_accepted=True,
    ).first()
    if not patient:
        return jsonify({"message": "Patient not assigned to you"}), 403

    assignment = ExerciseAssignment(
        doctor_id=doctor_id,
        patient_id=patient_id,
        exercises=exercises,
        doctor_note=doctor_note,
    )
    db.session.add(assignment)

    # Build a readable exercise name list for the notification
    ex_names = ", ".join(e.get("name", "exercise") for e in exercises[:3])
    suffix   = f" and {len(exercises) - 3} more" if len(exercises) > 3 else ""

    _send_notification(
        recipient_id=patient_id,
        sender_id=doctor_id,
        notif_type="exercise_assigned",
        message=(
            f"Dr. {doctor.name} has assigned you {len(exercises)} exercise(s): "
            f"{ex_names}{suffix}. Check your exercise plan."
        ),
    )

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500

    return jsonify({
        "message":       "Exercises assigned successfully",
        "assignment_id": assignment.id,
        "count":         len(exercises),
    }), 201


# ═══════════════════════════════════════════════════════════════════════════════
# DOCTOR: Serve rehab session graphs (angle-vs-time & progress charts)
# ═══════════════════════════════════════════════════════════════════════════════

@user_bp.get("/doctor/session-graph/<int:session_id>/<graph_type>")
@jwt_required()
def get_session_graph(session_id, graph_type):
    """
    Serves a PNG graph for a rehab session.
    graph_type: 'angle' or 'progress'
    
    Security: only the assigned doctor can view the patient's graphs.
    """
    if graph_type not in ('angle', 'progress'):
        return jsonify({"message": "Invalid graph type"}), 400

    doctor_id = int(get_jwt_identity())
    doctor = User.query.get(doctor_id)
    if not doctor or doctor.role not in ("doctor", "admin"):
        return jsonify({"message": "Forbidden"}), 403

    rehab_db = SessionLocal()
    try:
        rehab_session = rehab_db.query(RehabSession).filter_by(id=session_id).first()
        if not rehab_session:
            return jsonify({"message": "Session not found"}), 404

        rehab_patient = rehab_db.query(RehabPatient).filter_by(id=rehab_session.patient_id).first()
        if not rehab_patient:
            return jsonify({"message": "Patient not found"}), 404

        # Security: confirm patient is assigned to this doctor
        flask_patient = User.query.filter_by(
            email=rehab_patient.email,
            role="patient",
            assigned_doctor_id=doctor_id,
            doctor_accepted=True,
        ).first()
        if not flask_patient:
            return jsonify({"message": "Patient not assigned to you"}), 403

        # Get the appropriate graph path
        if graph_type == 'angle':
            graph_path = rehab_session.graph_path
        else:  # progress
            graph_path = rehab_session.progress_path

        if not graph_path or not os.path.isfile(graph_path):
            return jsonify({"message": "Graph not available"}), 404

        return send_file(graph_path, mimetype='image/png')

    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500
    finally:
        rehab_db.close()