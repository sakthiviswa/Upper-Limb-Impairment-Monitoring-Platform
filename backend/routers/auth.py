"""
Auth Router
POST /api/register  - create a new account
POST /api/login     - authenticate and get JWT
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas_auth import RegisterRequest, LoginRequest
from security import create_access_token

router = APIRouter()


@router.post("/register", status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    # Disallow public creation of admin accounts. Admins must be created
    # through a protected initialization script or by an existing Super Admin.
    if (payload.role or '').lower() == 'admin':
        raise HTTPException(
            status_code=403,
            detail=("Creating admin accounts via public registration is disabled. "
                    "Use the secure admin creation process or contact the system administrator."),
        )

    user = User(
        name=payload.name.strip(),
        email=email,
        role=payload.role,
    )
    user.password = payload.password  # triggers bcrypt hashing

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "name": user.name},
    )

    return {
        "message": "Account created successfully",
        "token": token,
        "user": user.to_dict(),
    }


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if not user or not user.check_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "name": user.name},
    )

    return {
        "message": "Login successful",
        "token": token,
        "user": user.to_dict(),
    }
