"""
User & Dashboard Routes
GET  /api/profile          – any authenticated user
GET  /api/patient/dashboard
GET  /api/doctor/dashboard
GET  /api/admin/dashboard
"""

from functools import wraps
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from extensions import db
from models.user import User

user_bp = Blueprint("user", __name__, url_prefix="/api")


# ── Role-guard decorator ───────────────────────────────────────────────────────
def role_required(*allowed_roles):
    """Decorator: enforces that the JWT owner has one of the allowed roles."""
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") not in allowed_roles:
                return jsonify({"message": "Access forbidden: insufficient role"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


# ── Profile ────────────────────────────────────────────────────────────────────
@user_bp.get("/profile")
@jwt_required()
def profile():
    """Return the current user's profile."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


# ── Dashboards ─────────────────────────────────────────────────────────────────
@user_bp.get("/patient/dashboard")
@role_required("patient")
def patient_dashboard():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    return jsonify({
        "message": f"Welcome to your Patient Dashboard, {user.name}!",
        "role": "patient",
        "data": {
            "appointments": [
                {"id": 1, "doctor": "Dr. Smith", "date": "2026-03-10", "status": "Confirmed"},
                {"id": 2, "doctor": "Dr. Lee", "date": "2026-03-22", "status": "Pending"},
            ],
            "prescriptions": 3,
            "health_score": 87,
        },
    }), 200


@user_bp.get("/doctor/dashboard")
@role_required("doctor")
def doctor_dashboard():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    return jsonify({
        "message": f"Welcome, {user.name}! Here is your Doctor Dashboard.",
        "role": "doctor",
        "data": {
            "today_patients": 8,
            "pending_reviews": 4,
            "schedule": [
                {"time": "09:00", "patient": "Alice Brown", "type": "Check-up"},
                {"time": "11:30", "patient": "Bob Carter", "type": "Follow-up"},
                {"time": "14:00", "patient": "Carol Davis", "type": "Consultation"},
            ],
        },
    }), 200


@user_bp.get("/admin/dashboard")
@role_required("admin")
def admin_dashboard():
    # Live stats from DB
    total_users = User.query.count()
    patients = User.query.filter_by(role="patient").count()
    doctors = User.query.filter_by(role="doctor").count()
    admins = User.query.filter_by(role="admin").count()
    recent = User.query.order_by(User.created_at.desc()).limit(5).all()

    return jsonify({
        "message": "Admin Control Panel",
        "role": "admin",
        "data": {
            "stats": {
                "total_users": total_users,
                "patients": patients,
                "doctors": doctors,
                "admins": admins,
            },
            "recent_users": [u.to_dict() for u in recent],
        },
    }), 200