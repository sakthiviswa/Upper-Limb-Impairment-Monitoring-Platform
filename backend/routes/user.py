"""
User / Dashboard routes.
GET /api/patient/dashboard  – patient overview (appointments, prescriptions, health score)
Requires JWT.
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.user import User

user_bp = Blueprint("user", __name__, url_prefix="/api")


@user_bp.get("/patient/dashboard")
@jwt_required()
def patient_dashboard():
    """
    Return dashboard data for the logged-in patient.
    Frontend expects: { data: { appointments: [], prescriptions: number, health_score: number } }
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role != "patient":
        return jsonify({"message": "Forbidden"}), 403

    # Mock dashboard data for the patient view
    data = {
        "appointments": [
            {"id": 1, "doctor": "Dr. Smith", "date": "2025-03-15", "status": "Confirmed"},
            {"id": 2, "doctor": "Dr. Jones", "date": "2025-03-22", "status": "Pending"},
        ],
        "prescriptions": 2,
        "health_score": 85,
    }
    return jsonify({"data": data}), 200


@user_bp.get("/doctor/dashboard")
@jwt_required()
def doctor_dashboard():
    """
    Return dashboard data for the logged-in doctor.
    Frontend expects: { data: { today_patients, pending_reviews, schedule: [{ time, patient, type }] } }
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role not in ("doctor", "admin"):
        return jsonify({"message": "Forbidden"}), 403

    # Mock dashboard data for the doctor view
    data = {
        "today_patients": 8,
        "pending_reviews": 3,
        "schedule": [
            {"time": "09:00", "patient": "John Doe", "type": "Check-up"},
            {"time": "10:30", "patient": "Jane Smith", "type": "Follow-up"},
            {"time": "14:00", "patient": "Bob Wilson", "type": "Consultation"},
        ],
    }
    return jsonify({"data": data}), 200


@user_bp.get("/admin/dashboard")
@jwt_required()
def admin_dashboard():
    """
    Admin overview dashboard.
    Frontend expects:
      {
        data: {
          stats: { total_users, patients, doctors, admins },
          recent_users: [ { id, name, email, role, created_at, ... } ]
        }
      }
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role != "admin":
        return jsonify({"message": "Forbidden"}), 403

    total_users = User.query.count()
    patients = User.query.filter_by(role="patient").count()
    doctors = User.query.filter_by(role="doctor").count()
    admins = User.query.filter_by(role="admin").count()

    recent_users = (
        User.query.order_by(User.created_at.desc()).limit(10).all()
    )

    data = {
        "stats": {
            "total_users": total_users,
            "patients": patients,
            "doctors": doctors,
            "admins": admins,
        },
        "recent_users": [u.to_dict() for u in recent_users],
    }

    return jsonify({"data": data}), 200