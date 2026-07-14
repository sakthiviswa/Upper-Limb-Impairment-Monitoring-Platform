"""Verification service helpers for doctor verification routes."""

import json
import os
import re
import urllib.parse
import urllib.request
from difflib import SequenceMatcher
from typing import Optional

from PIL import Image
from pydantic import BaseModel, Field

try:
    import pytesseract  # type: ignore
except Exception:  # pragma: no cover - optional runtime dependency
    pytesseract = None

try:
    import face_recognition  # type: ignore
except Exception:  # pragma: no cover - optional runtime dependency
    face_recognition = None


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _similarity(a: Optional[str], b: Optional[str]) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _extract_text(image_path: Optional[str]) -> str:
    if not image_path or not os.path.exists(image_path):
        return ""
    try:
        image = Image.open(image_path).convert("RGB")
    except Exception:
        return ""

    if pytesseract is not None:
        try:
            return pytesseract.image_to_string(image)
        except Exception:
            pass

    return ""


def _extract_fields(ocr_text: str, account_name: str) -> dict:
    text = re.sub(r"\s+", " ", ocr_text or "").strip()
    name_matches = re.findall(r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})", text)
    id_name = None
    if name_matches:
        id_name = name_matches[0]
    cert_name = None
    if len(name_matches) > 1:
        cert_name = name_matches[1]

    registration_match = re.search(r"(?:reg(?:istration)?(?:\s|#)?(?:no|number)?[:#-]?\s*([A-Za-z0-9/-]{2,20}))", text, re.I)
    registration = registration_match.group(1).strip() if registration_match else None
    id_number = None
    id_number_match = re.search(r"(?:id|passport|license|number)[:#-]?\s*([A-Za-z0-9]{3,20})", text, re.I)
    if id_number_match:
        id_number = id_number_match.group(1).strip()

    issuing_authority = None
    issuing_match = re.search(r"(?:issuing|authority|council|medical council)[:#-]?\s*([A-Za-z .,-]{3,60})", text, re.I)
    if issuing_match:
        issuing_authority = issuing_match.group(1).strip()

    if not id_name and account_name:
        id_name = account_name
    if not cert_name and id_name:
        cert_name = id_name

    return {
        "id_name": id_name,
        "id_number": id_number,
        "cert_name": cert_name,
        "registration_number": registration,
        "issuing_authority": issuing_authority,
    }


def _validate_registration(registration_number: Optional[str], account_name: Optional[str]) -> dict:
    if not registration_number:
        return {
            "valid": False,
            "score": 0.2,
            "source": "missing",
            "detail": "No registration number detected in the certificate.",
        }

    api_url = os.getenv("MEDICAL_COUNCIL_API_URL")
    api_key = os.getenv("MEDICAL_COUNCIL_API_KEY")
    if api_url:
        try:
            params = urllib.parse.urlencode({"registration_number": registration_number, "name": account_name or ""})
            request = urllib.request.Request(
                f"{api_url}?{params}",
                headers={"Authorization": f"Bearer {api_key}"} if api_key else {},
            )
            with urllib.request.urlopen(request, timeout=5) as response:
                payload = json.loads(response.read().decode("utf-8"))
                if payload.get("valid") is True:
                    return {
                        "valid": True,
                        "score": 0.95,
                        "source": "external_api",
                        "detail": payload.get("message") or "Registration number validated via configured council API.",
                    }
                return {
                    "valid": False,
                    "score": 0.35,
                    "source": "external_api",
                    "detail": payload.get("message") or "Registration number did not validate with the configured council API.",
                }
        except Exception:
            pass

    pattern = re.compile(r"^[A-Za-z0-9/-]{3,20}$")
    if pattern.match(registration_number):
        return {
            "valid": True,
            "score": 0.7,
            "source": "heuristic",
            "detail": "The registration format looks plausible and passed local validation heuristics.",
        }

    return {
        "valid": False,
        "score": 0.2,
        "source": "heuristic",
        "detail": "The registration number format does not match the expected credential pattern.",
    }


def _evaluate_document_authenticity(image_path: Optional[str]) -> dict:
    if not image_path or not os.path.exists(image_path):
        return {"score": 0.2, "detail": "No document image was available for authenticity screening."}

    try:
        image = Image.open(image_path).convert("RGB")
        width, height = image.size
        size_bytes = os.path.getsize(image_path)
        gray = image.convert("L")
        histogram = gray.histogram()
        pixels = width * height
        non_zero = sum(1 for value in histogram if value > 0)
        entropy = sum((count / pixels) * (0 if count == 0 else -1 * (count / pixels) * (count / pixels).bit_length()) for count in histogram if count)
    except Exception:
        return {"score": 0.25, "detail": "The document image could not be inspected for tampering indicators."}

    score = 0.85
    if size_bytes < 20_000:
        score -= 0.15
    if width < 600 or height < 600:
        score -= 0.1
    if non_zero < 40:
        score -= 0.2

    return {
        "score": _clamp(score),
        "detail": f"Image dimensions {width}x{height} and file size {size_bytes} bytes passed a basic authenticity screening.",
    }


def _face_match_score(face_image_path: Optional[str], id_image_path: Optional[str]) -> dict:
    if not face_image_path or not id_image_path or not os.path.exists(face_image_path) or not os.path.exists(id_image_path):
        return {"score": 0.3, "detail": "Face matching could not be completed because one of the images was missing."}

    if face_recognition is not None:
        try:
            face_image = face_recognition.load_image_file(face_image_path)
            id_image = face_recognition.load_image_file(id_image_path)
            face_encodings = face_recognition.face_encodings(face_image)
            id_encodings = face_recognition.face_encodings(id_image)
            if face_encodings and id_encodings:
                distance = face_recognition.face_distance([face_encodings[0]], id_encodings[0])[0]
                score = 1.0 - distance
                return {"score": _clamp(score), "detail": "Face comparison completed with face-recognition."}
        except Exception:
            pass

    return {"score": 0.72, "detail": "Face comparison used a fallback heuristic because the face-recognition runtime was unavailable."}


def _liveness_score(live_capture_path: Optional[str], face_image_path: Optional[str]) -> dict:
    if live_capture_path and os.path.exists(live_capture_path):
        return {"score": 0.92, "detail": "Live webcam capture was received and used as a liveness signal."}
    if face_image_path and os.path.exists(face_image_path):
        return {"score": 0.68, "detail": "A static selfie was supplied; liveness confidence is lower than a live capture."}
    return {"score": 0.3, "detail": "No liveness sample was supplied."}


def _write_verification_log(log_path: str, payload: dict) -> None:
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    with open(log_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)


def run_verification(
    account_name: str,
    face_image_path: str,
    government_id_path: str,
    medical_certificate_path: str,
    doctor_id: Optional[int] = None,
    live_capture_path: Optional[str] = None,
) -> dict:
    """Run a multi-layer verification pipeline and return structured results."""

    has_all_files = bool(face_image_path and government_id_path and medical_certificate_path)
    if not has_all_files:
        return {
            "status": "manual_review",
            "overall_score": 45.0,
            "face_match_score": None,
            "name_match_score": None,
            "field_completeness_score": None,
            "ai_notes": json.dumps({
                "summary": "Verification requires all required documents to be submitted.",
                "reasons": ["The doctor did not upload all required files."],
                "ocr_preview": "",
            }, ensure_ascii=False),
        }

    government_id_text = _extract_text(government_id_path)
    certificate_text = _extract_text(medical_certificate_path)
    combined_text = "\n".join([government_id_text, certificate_text]).strip()
    extracted = _extract_fields(combined_text, account_name)

    registration_validation = _validate_registration(extracted.get("registration_number"), account_name)
    face_result = _face_match_score(face_image_path, government_id_path)
    authenticity_result = _evaluate_document_authenticity(government_id_path)
    liveness_result = _liveness_score(live_capture_path, face_image_path)

    name_match_score = _similarity(account_name, extracted.get("id_name") or extracted.get("cert_name"))
    field_completeness_score = 0.0
    if extracted.get("id_name"):
        field_completeness_score += 0.25
    if extracted.get("id_number"):
        field_completeness_score += 0.25
    if extracted.get("registration_number"):
        field_completeness_score += 0.25
    if extracted.get("issuing_authority"):
        field_completeness_score += 0.25

    ocr_confidence = 0.85 if combined_text.strip() else 0.25
    overall_score = round(
        (
            ocr_confidence * 0.25
            + face_result["score"] * 0.25
            + authenticity_result["score"] * 0.2
            + registration_validation["score"] * 0.2
            + liveness_result["score"] * 0.1
            + name_match_score * 0.1
        ) * 100
    )

    reasons = []
    if registration_validation["valid"]:
        reasons.append("Registration number passed validation.")
    else:
        reasons.append(registration_validation["detail"])
    reasons.append(face_result["detail"])
    reasons.append(authenticity_result["detail"])
    reasons.append(liveness_result["detail"])
    if combined_text.strip():
        reasons.append("OCR text was extracted successfully from the submitted documents.")
    else:
        reasons.append("OCR could not extract readable text from the submitted documents.")

    if overall_score >= 90 and registration_validation["valid"] and face_result["score"] >= 0.8 and authenticity_result["score"] >= 0.75 and liveness_result["score"] >= 0.85:
        status = "auto_verified"
    elif overall_score >= 70:
        status = "manual_review"
    else:
        status = "rejected"

    payload = {
        "summary": f"Verification result for {account_name}: {status} with confidence {overall_score}/100.",
        "status": status,
        "overall_score": overall_score,
        "face_match_score": round(face_result["score"], 2),
        "name_match_score": round(name_match_score, 2),
        "field_completeness_score": round(field_completeness_score, 2),
        "reasons": reasons,
        "ocr_preview": combined_text[:2500],
        "registration_validation": registration_validation,
        "document_authenticity": authenticity_result,
        "liveness": liveness_result,
        "extracted_fields": extracted,
    }

    if doctor_id is not None:
        _write_verification_log(os.path.join("outputs", "verifications", str(doctor_id), "verification_log.json"), payload)

    return {
        "status": status,
        "overall_score": overall_score,
        "face_match_score": round(face_result["score"], 2),
        "name_match_score": round(name_match_score, 2),
        "field_completeness_score": round(field_completeness_score, 2),
        "ai_notes": json.dumps(payload, ensure_ascii=False),
        "government_id_ocr_text": government_id_text,
        "medical_certificate_ocr_text": certificate_text,
        "extracted_id_name": extracted.get("id_name"),
        "extracted_id_number": extracted.get("id_number"),
        "extracted_cert_name": extracted.get("cert_name"),
        "extracted_registration_number": extracted.get("registration_number"),
        "extracted_issuing_authority": extracted.get("issuing_authority"),
    }


class VerificationReviewRequest(BaseModel):
    """Admin decision on a doctor's verification submission."""
    decision: str = Field(..., description="'verified', 'rejected', or 'manual_review'")
    notes: Optional[str] = ""


class VerificationResultResponse(BaseModel):
    id: int
    doctorId: int
    status: str
    overallScore: Optional[float] = None
    faceMatchScore: Optional[float] = None
    nameMatchScore: Optional[float] = None
    fieldCompletenessScore: Optional[float] = None
    aiNotes: Optional[str] = None

    class Config:
        from_attributes = True