"""Patients CRUD router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from database import get_db
from models.models import Patient
from models.schemas import PatientCreate

router = APIRouter(prefix="/patients", tags=["Patients"])


# ---------------------------------------------------
# CREATE PATIENT
# ---------------------------------------------------
@router.post("/", status_code=201)
def create_patient(data: PatientCreate, db: DBSession = Depends(get_db)):

    # Check duplicate email (case insensitive)
    existing_patient = (
        db.query(Patient)
        .filter(func.lower(Patient.email) == data.email.lower())
        .first()
    )

    if existing_patient:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    patient = Patient(**data.model_dump())

    try:
        db.add(patient)
        db.commit()
    except IntegrityError:
        db.rollback()
        # In case of race condition where another process just inserted same email
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    db.refresh(patient)

    # ✅ Safe return as plain dict
    return patient.to_dict()


# ---------------------------------------------------
# GET PATIENT BY ID
# ---------------------------------------------------
@router.get("/{patient_id}")
def get_patient(patient_id: int, db: DBSession = Depends(get_db)):

    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    return patient.to_dict()


# ---------------------------------------------------
# GET PATIENT BY EMAIL
# ---------------------------------------------------
@router.get("/email/{email}")
def get_patient_by_email(email: str, db: DBSession = Depends(get_db)):

    patient = (
        db.query(Patient)
        .filter(func.lower(Patient.email) == email.lower())
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    return patient.to_dict()