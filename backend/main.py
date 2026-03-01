"""
RehabMonitor – FastAPI Backend Entry Point
==========================================
Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import engine, Base
from routers import sessions, patients, reports

# ── Create tables on startup ───────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Ensure output directories exist ───────────────────────────────────────────
os.makedirs("outputs/graphs", exist_ok=True)
os.makedirs("outputs/reports", exist_ok=True)

app = FastAPI(
    title="RehabMonitor API",
    description="Real-time rehabilitation monitoring system",
    version="1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (graphs/PDFs) ─────────────────────────────────────────────────
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
# Patients router already has /patients prefix; mount under /api so final paths are /api/patients/...
app.include_router(patients.router, prefix="/api", tags=["Patients"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "RehabMonitor API v1.0"}