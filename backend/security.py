"""
Security utilities for the FastAPI backend.

This file centralises password hashing, JWT creation/verification and the
`get_current_user` dependency. It uses `passlib` for password hashing (bcrypt)
and `PyJWT` for token handling. Secrets are read from environment variables.
"""

import os
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db

# Configuration: prefer environment variables in production
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-change-in-production")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# Use OAuth2 password bearer for token extraction (login endpoint: /api/login)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

try:
    # Prefer passlib CryptContext when available
    from passlib.context import CryptContext

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


    def hash_password(plain_text: str) -> str:
        return pwd_context.hash(plain_text)


    def verify_password(plain_text: str, hashed: str) -> bool:
        try:
            return pwd_context.verify(plain_text, hashed)
        except Exception:
            return False

except Exception:
    # Fallback to using the bcrypt library directly if passlib fails to load
    import bcrypt


    def hash_password(plain_text: str) -> str:
        return bcrypt.hashpw(plain_text.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


    def verify_password(plain_text: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(plain_text.encode("utf-8"), hashed.encode("utf-8"))
        except Exception:
            return False


def create_access_token(identity: str, additional_claims: Optional[dict] = None, expires_minutes: Optional[int] = None) -> str:
    """Create a JWT access token containing the subject and optional claims.

    The token expiry defaults to `ACCESS_TOKEN_EXPIRE_MINUTES` but can be
    overridden per-call (useful for testing or refresh token flows).
    """
    now = datetime.utcnow()
    expires = now + timedelta(minutes=(expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": str(identity),
        "iat": now,
        "exp": expires,
    }
    if additional_claims:
        payload.update(additional_claims)
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token, returning its payload.

    This will raise the underlying PyJWT exceptions for expired/invalid
    tokens which calling code can handle and convert to HTTP responses.
    """
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """FastAPI dependency to resolve the current user from the Authorization token.

    Raises `HTTPException` with 401/422 when the token is missing/invalid or
    the user does not exist.
    """
    from models.user import User  # local import to avoid circular imports

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization token required")

    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired, please login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid token")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user
