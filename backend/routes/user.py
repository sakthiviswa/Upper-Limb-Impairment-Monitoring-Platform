"""
User / Dashboard & Profile routes.
GET  /api/user/profile              – get user profile (all fields)
PUT  /api/user/profile              – update profile + notify doctors if first save
GET  /api/patient/dashboard         – patient overview
GET  /api/doctor/dashboard          – doctor overview
GET  /api/notifications             – get notifications for current user
POST /api/notifications/<id>/read   – mark notification as read
POST /api/doctor/accept-patient/<patient_id>  – doctor accepts a patient
POST /api/doctor/decline-patient/<patient_id> – doctor declines a patient
Requires JWT.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User
from models.notification import Notification

user_bp = Blueprint("user", __name__, url_prefix="/api")


# ── helpers ────────────────────────────────────────────────────────────────────
def _send_notification(recipient_id: int, sender_id: int, notif_type: str, message: str):
    n = Notification(
        recipient_id=recipient_id,
        sender_id=sender_id,
        type=notif_type,
        message=message,
    )
    db.session.add(n)


# ── Profile Endpoints ──────────────────────────────────────────────────────────
@user_bp.get("/user/profile")
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    profile = {
        "id":           user.id,
        "fullName":     user.name,
        "email":        user.email,
        "age":          user.age,
        "gender":       user.gender,
        "phoneNumber":  user.phone_number,
        "role":         user.role,
        "doctorAccepted":   user.doctor_accepted,
        "assignedDoctorId": user.assigned_doctor_id,
    }
    if user.role == "patient":
        profile.update({
            "injuredArm":      user.injured_arm,
            "injuryType":      user.injury_type,
            "injurySeverity":  user.injury_severity,
            "dateOfInjury":    user.date_of_injury,
            "doctorName":      user.doctor_name,
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

    # ── Track whether this is the first profile completion for a patient ───────
    is_first_profile_save = (
        user.role == "patient"
        and not user.age          # hasn't filled in profile yet
        and data.get("age")       # now filling it in
    )

    # ── Core personal fields ───────────────────────────────────────────────────
    if "fullName" in data:
        user.name = (data["fullName"] or "").strip()
    if "age" in data:
        user.age = data["age"]
    if "gender" in data:
        user.gender = data["gender"]
    if "phoneNumber" in data:
        user.phone_number = data["phoneNumber"]

    # ── Patient-only medical / rehab fields ────────────────────────────────────
    if user.role == "patient":
        if "injuredArm" in data:
            user.injured_arm = data["injuredArm"]
        if "injuryType" in data:
            user.injury_type = data["injuryType"]
        if "injurySeverity" in data:
            user.injury_severity = data["injurySeverity"]
        if "dateOfInjury" in data:
            user.date_of_injury = data["dateOfInjury"]
        if "doctorName" in data:
            user.doctor_name = data["doctorName"]
        if "sessionDuration" in data:
            user.session_duration = data["sessionDuration"]
        if "difficultyLevel" in data:
            user.difficulty_level = data["difficultyLevel"]
        if "reminderEnabled" in data:
            user.reminder_enabled = data.get("reminderEnabled", False)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update profile: {str(e)}"}), 500

    # ── On first profile save: notify all doctors ──────────────────────────────
    if is_first_profile_save:
        doctors = User.query.filter_by(role="doctor").all()
        for doc in doctors:
            _send_notification(
                recipient_id=doc.id,
                sender_id=user.id,
                notif_type="doctor_request",
                message=(
                    f"New patient {user.name} has completed their profile and is "
                    f"looking for a doctor. Injury: {user.injury_type or 'N/A'}, "
                    f"Severity: {user.injury_severity or 'N/A'}."
                ),
            )
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

    return jsonify({
        "message": "Profile updated successfully",
        "notifiedDoctors": is_first_profile_save,
        "profile": user.to_dict(),
    }), 200


# ── Notifications ─────────────────────────────────────────────────────────────
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
    # Attach sender name
    result = []
    for n in notifs:
        d = n.to_dict()
        sender = User.query.get(n.sender_id)
        d["senderName"] = sender.name if sender else "Unknown"
        d["senderEmail"] = sender.email if sender else ""
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


# ── Doctor accept / decline patient ───────────────────────────────────────────
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

    # Notify the patient
    _send_notification(
        recipient_id=patient.id,
        sender_id=doctor.id,
        notif_type="request_accepted",
        message=(
            f"Dr. {doctor.name} has accepted your request and is now your assigned doctor. "
            f"You can view their details in your profile."
        ),
    )

    db.session.commit()
    return jsonify({"message": f"Patient {patient.name} accepted", "patient": patient.to_dict()}), 200


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

    # Notify the patient
    _send_notification(
        recipient_id=patient.id,
        sender_id=doctor.id,
        notif_type="request_declined",
        message=(
            f"Dr. {doctor.name} is currently unavailable and could not accept your request. "
            f"Another doctor may still accept."
        ),
    )
    db.session.commit()
    return jsonify({"message": "Patient declined"}), 200


# ── Doctor: list pending patient requests ──────────────────────────────────────
@user_bp.get("/doctor/pending-patients")
@jwt_required()
def pending_patients():
    doctor_id = get_jwt_identity()
    doctor = User.query.get(doctor_id)
    if not doctor or doctor.role not in ("doctor", "admin"):
        return jsonify({"message": "Forbidden"}), 403

    # Patients who have not yet been assigned to any doctor
    patients = (
        User.query
        .filter_by(role="patient", doctor_accepted=False)
        .filter(User.age.isnot(None))   # only those who completed profile
        .all()
    )
    return jsonify({"patients": [p.to_dict() for p in patients]}), 200


# ── Doctor: list my accepted patients ─────────────────────────────────────────
@user_bp.get("/doctor/my-patients")
@jwt_required()
def my_patients():
    doctor_id = get_jwt_identity()
    doctor = User.query.get(doctor_id)
    if not doctor or doctor.role not in ("doctor", "admin"):
        return jsonify({"message": "Forbidden"}), 403

    patients = User.query.filter_by(role="patient", assigned_doctor_id=doctor_id).all()
    return jsonify({"patients": [p.to_dict() for p in patients]}), 200


# ── Dashboard endpoints ────────────────────────────────────────────────────────
@user_bp.get("/patient/dashboard")
@jwt_required()
def patient_dashboard():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role != "patient":
        return jsonify({"message": "Forbidden"}), 403

    unread_count = Notification.query.filter_by(
        recipient_id=user_id, is_read=False
    ).count()

    data = {
        "appointments": [
            {"id": 1, "doctor": "Dr. Smith", "date": "2025-03-15", "status": "Confirmed"},
            {"id": 2, "doctor": "Dr. Jones", "date": "2025-03-22", "status": "Pending"},
        ],
        "prescriptions":    2,
        "health_score":     85,
        "unread_notifications": unread_count,
        "doctor_accepted":  user.doctor_accepted,
        "assigned_doctor":  user.doctor_name,
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
        role="patient", doctor_accepted=False
    ).filter(User.age.isnot(None)).count()

    accepted_count = User.query.filter_by(
        role="patient", assigned_doctor_id=user_id
    ).count()

    unread_count = Notification.query.filter_by(
        recipient_id=user_id, is_read=False
    ).count()

    data = {
        "today_patients":        accepted_count,
        "pending_reviews":       pending_count,
        "unread_notifications":  unread_count,
        "schedule": [
            {"time": "09:00", "patient": "John Doe",    "type": "Check-up"},
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

    total_users = User.query.count()
    patients    = User.query.filter_by(role="patient").count()
    doctors     = User.query.filter_by(role="doctor").count()
    admins      = User.query.filter_by(role="admin").count()
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