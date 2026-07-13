"""
RehabMonitor / Upper-Limb-Impairment-Monitoring-Platform
==========================================================
Single FastAPI Backend Entry Point
-----------------------------------
This used to be TWO separate backends (a Flask app on port 5000 for
auth/users/messaging/appointments, and a FastAPI app on port 8000 for
rehab sessions/patients/reports) sharing two different databases.

It is now ONE FastAPI application, served entirely by uvicorn, backed
by a single shared database.

Run:
    uvicorn main:app --reload --port 8000
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from database import engine, Base, SessionLocal

# Import every model so SQLAlchemy registers all tables before create_all()
from models.user import User
from models.notification import Notification
from models.message import Conversation, Message
from models.exercise_assignment import ExerciseAssignment
from models.appointment import Appointment
from models.doctor_verification import DoctorVerification
from models.models import Patient, RehabSession  # noqa: F401 (rehab tables)

from routers import auth, users, sessions, patients, reports, verification

# ── Create all tables on startup ────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Ensure output directories exist ─────────────────────────────────────────
os.makedirs("outputs/graphs", exist_ok=True)
os.makedirs("outputs/reports", exist_ok=True)
os.makedirs("outputs/verifications", exist_ok=True)

app = FastAPI(
    title="Upper Limb Impairment Monitoring Platform API",
    description="Single consolidated FastAPI backend: auth, users, messaging, "
                 "appointments, notifications and rehab session monitoring.",
    version="2.0.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Error handling ───────────────────────────────────────────────────────────
# The React frontend was originally written against the Flask backend and
# reads error text from `error.response.data.message`. Some newer FastAPI
# routes read `error.response.data.detail`. We return BOTH keys so every
# existing frontend call site keeps working unmodified.
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    detail = exc.detail
    message = detail if isinstance(detail, str) else str(detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": message, "detail": detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "message": "Validation failed",
            "detail": exc.errors(),
            "errors": exc.errors(),
        },
    )


# ── Static files (graphs/PDFs) ───────────────────────────────────────────────
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# ── Routers (all mounted under /api, matching the old Flask + FastAPI paths) ─
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(patients.router, prefix="/api", tags=["Patients"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(verification.router, prefix="/api", tags=["Verification"])


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Upper Limb Impairment Monitoring Platform API v2.0"}


# ── Seed a default admin on first run (mirrors the old Flask behaviour) ──────
@app.on_event("startup")
def seed_default_admin():
    db = SessionLocal()
    try:
        if not db.query(User).filter_by(role="admin").first():
            admin = User(name="System Admin", email="admin@healthcare.dev", role="admin")
            admin.password = "Admin@1234"
            db.add(admin)
            db.commit()
            print("Default admin seeded -> admin@healthcare.dev / Admin@1234")
    finally:
        db.close()