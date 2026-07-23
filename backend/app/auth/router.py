"""Boon — Auth API Router.

Endpoints:
- POST /auth/register       — Register a new user (admin only)
- POST /auth/login           — Login, returns JWT tokens
- POST /auth/refresh         — Refresh an access token
- GET  /auth/me              — Get current user profile
- POST /auth/change-password — Change password
- GET  /auth/public-key      — Get QR public key (for Flutter verification)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.auth.models import User
from app.auth.schemas import (
    RegisterRequest, RegisterResponse,
    LoginRequest, TokenResponse, UserResponse,
    RefreshRequest, ChangePasswordRequest,
)
from app.auth.dependencies import (
    get_current_user, require_admin, require_viewer,
)
from app.auth.utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_qr_public_key_pem,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Register (admin only) ─────────────────────────────────────────────────

@router.post("/register", response_model=RegisterResponse)
async def register(
    request: RegisterRequest,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Register a new user. Only accessible by admins."""
    # Check for existing username
    result = await session.execute(
        select(User).where(User.username == request.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken.",
        )

    # Check for existing email
    result = await session.execute(
        select(User).where(User.email == request.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        )

    user = User(
        username=request.username,
        email=request.email,
        hashed_password=hash_password(request.password),
        full_name=request.full_name,
        role=request.role,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return RegisterResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        created_at=user.created_at.isoformat(),
    )


# ── Login ─────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    session: AsyncSession = Depends(get_session),
):
    """Authenticate with username/email and password. Returns JWT tokens."""
    # Try username first, then email
    result = await session.execute(
        select(User).where(
            (User.username == request.username) | (User.email == request.username)
        )
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact an administrator.",
        )

    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id)

    # Store refresh token (in production, use a token blacklist/allowlist)
    # For now, we embed it in the response

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
        ),
    )


# ── Refresh Token ─────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshRequest,
    session: AsyncSession = Depends(get_session),
):
    """Exchange a refresh token for a new access token."""
    payload = decode_token(request.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
        )

    user_id = payload.get("sub")
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
        )

    new_access = create_access_token(user.id, user.role)
    new_refresh = create_refresh_token(user.id)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
        ),
    )


# ── Get Current User ──────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
    )


# ── Change Password ───────────────────────────────────────────────────────

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Change the current user's password."""
    if not verify_password(request.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    current_user.hashed_password = hash_password(request.new_password)
    await session.commit()

    return {"success": True, "message": "Password changed successfully."}


# ── Get QR Public Key ─────────────────────────────────────────────────────

@router.get("/public-key")
async def get_public_key():
    """Get the server's RSA public key for QR digital signature verification.
    
    Flutter clients use this to verify QR codes offline.
    """
    return {
        "algorithm": "RSA-2048-PSS-SHA256",
        "public_key_pem": get_qr_public_key_pem(),
        "format": "PEM",
    }


# ── List All Users (admin only) ───────────────────────────────────────────

@router.get("/users")
async def list_users(
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """List all registered users. Admin only."""
    result = await session.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return {
        "total": len(users),
        "users": [u.to_dict() for u in users],
    }
