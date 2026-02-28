"""
Auth Routes
POST /api/register  – create a new account
POST /api/login     – authenticate and get JWT
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from marshmallow import Schema, fields, validate, ValidationError, validates

from extensions import db
from models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

VALID_ROLES = {"patient", "doctor", "admin"}


# ── Validation schema ──────────────────────────────────────────────────────────
class RegisterSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))
    role = fields.Str(
        required=True,
        validate=validate.OneOf(VALID_ROLES, error="Role must be patient, doctor, or admin"),
    )


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)


register_schema = RegisterSchema()
login_schema = LoginSchema()


# ── Register ───────────────────────────────────────────────────────────────────
@auth_bp.post("/register")
def register():
    """Create a new user account."""
    json_data = request.get_json(silent=True)
    if not json_data:
        return jsonify({"message": "No JSON body provided"}), 400

    try:
        data = register_schema.load(json_data)
    except ValidationError as err:
        return jsonify({"message": "Validation failed", "errors": err.messages}), 422

    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify({"message": "Email already registered"}), 409

    user = User(
        name=data["name"].strip(),
        email=data["email"].lower().strip(),
        role=data["role"],
    )
    user.password = data["password"]          # triggers bcrypt hashing

    db.session.add(user)
    db.session.commit()

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "name": user.name},
    )

    return jsonify({
        "message": "Account created successfully",
        "token": token,
        "user": user.to_dict(),
    }), 201


# ── Login ──────────────────────────────────────────────────────────────────────
@auth_bp.post("/login")
def login():
    """Authenticate user and return JWT."""
    json_data = request.get_json(silent=True)
    if not json_data:
        return jsonify({"message": "No JSON body provided"}), 400

    try:
        data = login_schema.load(json_data)
    except ValidationError as err:
        return jsonify({"message": "Validation failed", "errors": err.messages}), 422

    user = User.query.filter_by(email=data["email"].lower().strip()).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"message": "Invalid email or password"}), 401

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "name": user.name},
    )

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user.to_dict(),
    }), 200