"""Pydantic request schemas for authentication."""

from pydantic import BaseModel, EmailStr, Field, field_validator

VALID_ROLES = {"patient", "doctor", "admin"}


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v):
        if v not in VALID_ROLES:
            raise ValueError("Role must be patient, doctor, or admin")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
