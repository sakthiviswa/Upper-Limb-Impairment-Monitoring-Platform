"""
Healthcare Role-Based Auth System – Flask Backend
Entry point: python app.py
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import config
from extensions import db, bcrypt, jwt
from routes.auth import auth_bp
from routes.user import user_bp


def create_app(env: str = None) -> Flask:
    env = env or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config[env])

    # ── Extensions ─────────────────────────────────────────────────────────────
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # ── CORS – allow React dev server ──────────────────────────────────────────
    origins = app.config["CORS_ORIGINS"].split(",")
    CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)

    # ── JWT error handlers ─────────────────────────────────────────────────────
    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"message": "Authorization token required", "reason": reason}), 401

    @jwt.expired_token_loader
    def expired_token(header, payload):
        return jsonify({"message": "Token has expired, please login again"}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"message": "Invalid token", "reason": reason}), 422

    # ── Blueprints ─────────────────────────────────────────────────────────────
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)

    # ── Health check ───────────────────────────────────────────────────────────
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "env": env}), 200

    # ── Create tables on first run ─────────────────────────────────────────────
    with app.app_context():
        db.create_all()

        # Seed a default admin if none exists
        from models.user import User
        if not User.query.filter_by(role="admin").first():
            admin = User(name="System Admin", email="admin@healthcare.dev", role="admin")
            admin.password = "Admin@1234"
            db.session.add(admin)
            db.session.commit()
            print("✅  Default admin seeded  →  admin@healthcare.dev / Admin@1234")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)