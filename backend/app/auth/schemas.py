"""Boon — Auth Pydantic Schemas."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ── Registration ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64, description="Unique username")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, max_length=128, description="Strong password")
    full_name: str | None = Field(None, max_length=128, description="Display name")
    role: str = Field("operator", pattern=r"^(admin|operator|viewer)$")


class RegisterResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str | None
    role: str
    created_at: str


# ── Login ─────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Password")


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str | None
    role: str
    is_active: bool


# ── Token Refresh ─────────────────────────────────────────────────────────

class RefreshRequest(BaseModel):
    refresh_token: str


# ── Password Change ───────────────────────────────────────────────────────

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
