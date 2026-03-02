"""
Sessions Router
===============
POST /api/sessions/submit   – submit a completed 30-sec session
GET  /api/sessions/{id}     – get one session
GET  /api/sessions/patient/{pid} – all sessions for a patient
"""

import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session as DBSession

from database import get_db
from models.models import RehabSession, Patient
from models.schemas import SessionCreateRequest
from services.injury_detection import (
    calculate_metrics, detect_injury_status, get_status_message
)
from services.graph_service import (
    generate_angle_vs_time, generate_progress_chart
)
from services.pdf_service import generate_pdf_report
from services.email_service import send_report_to_doctor

router = APIRouter()


@router.post("/submit")
def submit_session(
    payload: SessionCreateRequest,
    background_tasks: BackgroundTasks,
    db: DBSession = Depends(get_db),
):
    """
    Full pipeline:
    1. Validate patient
    2. Calculate metrics
    3. Detect injury status
    4. Save session
    5. Generate graphs (background)
    6. Generate PDF (background)
    7. Email doctor (background)
    """
    # ── 1. Validate patient ────────────────────────────────────────────────────
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")

    # ── 2. Calculate metrics ───────────────────────────────────────────────────
    angle_list = [{"t": p.t, "angle": p.angle} for p in payload.angle_series]
    metrics    = calculate_metrics(angle_list, patient.target_angle)

    # ── 3. Injury detection ────────────────────────────────────────────────────
    prev_session = (
        db.query(RehabSession)
        .filter(RehabSession.patient_id == payload.patient_id)
        .order_by(RehabSession.id.desc())
        .first()
    )
    prev_avg = prev_session.avg_angle if prev_session else None
    injury_status, delta = detect_injury_status(metrics["avg_angle"], prev_avg)

    # ── 4. Save session ────────────────────────────────────────────────────────
    session = RehabSession(
        patient_id      = payload.patient_id,
        avg_angle       = metrics["avg_angle"],
        max_angle       = metrics["max_angle"],
        min_angle       = metrics["min_angle"],
        accuracy        = metrics["accuracy"],
        consistency     = metrics["consistency"],
        duration_secs   = payload.duration_secs,
        frame_count     = metrics["frame_count"],
        injury_status   = injury_status,
        angle_delta     = delta,
        angle_series    = angle_list,
        doctor_notes    = payload.doctor_notes,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # ── 5-7. Background tasks ──────────────────────────────────────────────────
    background_tasks.add_task(
        _post_session_pipeline,
        session_id=session.id,
        patient_dict=patient.to_dict(),
        angle_list=angle_list,
        db_url=str(db.bind.url),
    )

    return session.to_dict()


def _post_session_pipeline(
    session_id: int,
    patient_dict: dict,
    angle_list: list,
    db_url: str,
):
    """
    Background: generate graphs, PDF, send email.
    Uses its own DB session to avoid threading issues.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from database import Base

    connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
    eng = create_engine(db_url, connect_args=connect_args)
    SL  = sessionmaker(bind=eng)
    db  = SL()

    try:
        session = db.query(RehabSession).filter(RehabSession.id == session_id).first()
        patient = db.query(Patient).filter(Patient.id == session.patient_id).first()

        # Get all sessions for progress chart
        all_sessions = (
            db.query(RehabSession)
            .filter(RehabSession.patient_id == patient.id)
            .order_by(RehabSession.id)
            .all()
        )
        sessions_dicts = [s.to_dict() for s in all_sessions]

        # Graphs
        graph_path = generate_angle_vs_time(
            angle_list, patient.target_angle,
            session.avg_angle, patient.name, session.id
        )
        progress_path = generate_progress_chart(
            sessions_dicts, patient.name, patient.target_angle
        )

        # Status message for PDF/email
        status_message = get_status_message(session.injury_status, session.angle_delta)

        # PDF
        pdf_path = generate_pdf_report(
            patient  = patient.to_dict(),
            session  = session.to_dict(),
            graph_path    = graph_path,
            progress_path = progress_path,
            status_message= status_message,
        )

        # Update paths
        session.graph_path    = graph_path
        session.progress_path = progress_path
        session.pdf_path      = pdf_path
        db.commit()

        # Email
        send_report_to_doctor(
            doctor_email   = patient.doctor_email,
            patient        = patient.to_dict(),
            session        = session.to_dict(),
            pdf_path       = pdf_path,
            status_message = status_message,
        )
    finally:
        db.close()


@router.get("/patient/{patient_id}")
def get_patient_sessions(patient_id: int, db: DBSession = Depends(get_db)):
    sessions = (
        db.query(RehabSession)
        .filter(RehabSession.patient_id == patient_id)
        .order_by(RehabSession.id.desc())
        .all()
    )
    return [s.to_dict() for s in sessions]


@router.get("/{session_id}")
def get_session(session_id: int, db: DBSession = Depends(get_db)):
    session = db.query(RehabSession).filter(RehabSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    return session.to_dict()
