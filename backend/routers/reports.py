"""Reports router – download PDF."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session as DBSession
import os

from database import get_db
from models.models import RehabSession

router = APIRouter()


@router.get("/{session_id}/download")
def download_report(session_id: int, db: DBSession = Depends(get_db)):
    session = db.query(RehabSession).filter(RehabSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    if not session.pdf_path or not os.path.exists(session.pdf_path):
        raise HTTPException(404, "PDF not yet generated – try again in a few seconds")
    return FileResponse(
        session.pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(session.pdf_path)
    )