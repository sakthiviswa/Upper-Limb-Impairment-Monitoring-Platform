"""
Doctor Verification Router
=============================
Face Image + Government ID + Medical Certificate -> AI Verification -> Identity Confirmed

    POST   /api/doctors/verify-certificate   (doctor)  submit the 3 documents
    GET    /api/doctors/verification-status  (doctor)  check own latest status
    GET    /api/admin/verifications          (admin)   list submissions (optional ?status=)
    GET    /api/admin/verifications/{id}     (admin)   full detail of one submission
    POST   /api/admin/verifications/{id}/review (admin) approve/reject
"""

import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from security import get_current_user
from models.user import User
from models.doctor_verification import DoctorVerification
from schemas_verification import VerificationReviewRequest
from services.verification_service import run_verification

router = APIRouter()

UPLOAD_ROOT = "outputs/verifications"
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_MB = 8


def _save_upload(file: UploadFile, doctor_id: int, label: str) -> str:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(422, f"{label}: unsupported file type ({file.content_type})")

    doctor_dir = os.path.join(UPLOAD_ROOT, str(doctor_id))
    os.makedirs(doctor_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    filename = f"{label}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(doctor_dir, filename)

    contents = file.file.read()
    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(422, f"{label}: file too large (max {MAX_FILE_SIZE_MB}MB)")

    with open(dest_path, "wb") as f:
        f.write(contents)

    return dest_path


# DOCTOR: submit documents for verification

@router.post("/doctors/verify-certificate", status_code=201)
def verify_certificate(
    face_image: UploadFile = File(...),
    government_id: UploadFile = File(...),
    medical_certificate: UploadFile = File(...),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if me.role not in ("doctor", "admin"):
        raise HTTPException(403, "Only doctors can submit verification documents")

    face_path = _save_upload(face_image, me.id, "face")
    id_path = _save_upload(government_id, me.id, "govid")
    cert_path = _save_upload(medical_certificate, me.id, "cert")

    result = run_verification(
        account_name=me.name,
        face_image_path=face_path,
        government_id_path=id_path,
        medical_certificate_path=cert_path,
    )

    record = DoctorVerification(
        doctor_id=me.id,
        face_image_path=face_path,
        government_id_path=id_path,
        medical_certificate_path=cert_path,
        **result,
    )
    db.add(record)

    # Auto-verified submissions flip the doctor's `verified` flag immediately.
    # Everything else waits for an admin to review it.
    if result["status"] == "auto_verified":
        me.verified = True

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to save verification: {str(e)}")

    db.refresh(record)
    return record.to_dict()


# DOCTOR: check own latest verification status

@router.get("/doctors/verification-status")
def verification_status(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    if me.role not in ("doctor", "admin"):
        raise HTTPException(403, "Forbidden")

    record = (
        db.query(DoctorVerification)
        .filter_by(doctor_id=me.id)
        .order_by(DoctorVerification.created_at.desc())
        .first()
    )
    if not record:
        return {"status": "not_submitted"}
    return record.to_dict()


# ADMIN: list submissions, optionally filtered by status

@router.get("/admin/verifications")
def list_verifications(
    status: str = None,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if me.role != "admin":
        raise HTTPException(403, "Forbidden")

    q = db.query(DoctorVerification)
    if status:
        q = q.filter_by(status=status)
    records = q.order_by(DoctorVerification.created_at.desc()).all()

    result = []
    for r in records:
        d = r.to_dict()
        doctor = db.query(User).filter(User.id == r.doctor_id).first()
        d["doctorName"] = doctor.name if doctor else "Unknown"
        d["doctorEmail"] = doctor.email if doctor else ""
        result.append(d)
    return {"verifications": result}


# ADMIN: full detail of one submission

@router.get("/admin/verifications/{verification_id}")
def get_verification_detail(
    verification_id: int,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if me.role != "admin":
        raise HTTPException(403, "Forbidden")

    record = db.query(DoctorVerification).filter_by(id=verification_id).first()
    if not record:
        raise HTTPException(404, "Verification not found")

    doctor = db.query(User).filter(User.id == record.doctor_id).first()
    d = record.to_dict()
    d["doctorName"] = doctor.name if doctor else "Unknown"
    d["doctorEmail"] = doctor.email if doctor else ""
    return d


# ADMIN: approve or reject a submission

@router.post("/admin/verifications/{verification_id}/review")
def review_verification(
    verification_id: int,
    data: VerificationReviewRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if me.role != "admin":
        raise HTTPException(403, "Forbidden")

    decision = (data.decision or "").lower()
    if decision not in ("verified", "rejected"):
        raise HTTPException(422, "decision must be 'verified' or 'rejected'")

    record = db.query(DoctorVerification).filter_by(id=verification_id).first()
    if not record:
        raise HTTPException(404, "Verification not found")

    record.status = decision
    record.review_notes = (data.notes or "").strip()
    record.reviewer_id = me.id
    record.reviewed_at = datetime.now(timezone.utc)

    doctor = db.query(User).filter(User.id == record.doctor_id).first()
    if doctor:
        doctor.verified = decision == "verified"

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to save review: {str(e)}")

    db.refresh(record)
    return record.to_dict()