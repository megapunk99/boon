"""Boon — Admin API Router.

Endpoints exclusive to admin role:
- User management (list, activate, deactivate, change role)
- Full scan data access (all users, all facilities)
- System health and diagnostics
- QR key regeneration
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.auth.models import User
from app.auth.dependencies import require_admin
from app.auth.schemas import UserResponse
from app.services import scan_service

router = APIRouter(prefix="/admin", tags=["Administration"])


# ── List All Users ────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """List all registered users with their details."""
    result = await session.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return {
        "total": len(users),
        "users": [u.to_dict() for u in users],
    }


# ── Get Single User ───────────────────────────────────────────────────────

@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Get details for a specific user."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.to_dict()


# ── Toggle User Active Status ─────────────────────────────────────────────

@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Enable or disable a user account."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot disable your own account.",
        )

    user.is_active = not user.is_active
    await session.commit()

    return {
        "success": True,
        "user_id": user.id,
        "is_active": user.is_active,
        "message": f"User {'activated' if user.is_active else 'deactivated'}.",
    }


# ── Change User Role ──────────────────────────────────────────────────────

@router.patch("/users/{user_id}/role")
async def change_user_role(
    user_id: str,
    new_role: str,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Change a user's role (admin/operator/viewer)."""
    if new_role not in ("admin", "operator", "viewer"):
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Must be one of: admin, operator, viewer.",
        )

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id and new_role != "admin":
        raise HTTPException(
            status_code=400,
            detail="Cannot remove your own admin role.",
        )

    old_role = user.role
    user.role = new_role
    await session.commit()

    return {
        "success": True,
        "user_id": user.id,
        "old_role": old_role,
        "new_role": new_role,
    }


# ── All Scan Data (admin sees everything) ─────────────────────────────────

@router.get("/scans")
async def get_all_scans(
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
    limit: int = 100,
    offset: int = 0,
):
    """Get ALL scan records across all users and facilities."""
    records, total = await scan_service.get_scan_history(session, limit, offset)
    items = [r.to_dict() for r in records]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": items,
        "count": len(items),
    }


# ── System Diagnostics ────────────────────────────────────────────────────

@router.get("/system")
async def system_diagnostics(
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Get system health, database stats, and user counts."""
    from sqlalchemy import func

    # User counts by role
    role_counts_result = await session.execute(
        select(User.role, func.count(User.id))
        .group_by(User.role)
    )
    role_counts = {row[0]: row[1] for row in role_counts_result.all()}

    # Total scans
    from app.models.scan_record import ScanRecord
    scan_count_result = await session.execute(func.count(ScanRecord.id))
    total_scans = scan_count_result.scalar() or 0

    return {
        "status": "operational",
        "version": "1.0.0",
        "users": {
            "total": sum(role_counts.values()),
            "by_role": role_counts,
        },
        "database": {
            "total_scans": total_scans,
            "status": "connected",
        },
        "qr_security": {
            "algorithm": "RSA-2048-PSS-SHA256",
            "key_status": "active",
        },
    }


# ── Delete Scan Record (admin only) ───────────────────────────────────────

@router.delete("/scans/{scan_id}")
async def delete_scan(
    scan_id: str,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Delete a specific scan record (for data correction)."""
    from app.models.scan_record import ScanRecord
    from sqlalchemy import delete as sa_delete

    result = await session.execute(
        sa_delete(ScanRecord).where(ScanRecord.scan_id == scan_id)
    )
    await session.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Scan not found")

    return {"success": True, "message": f"Scan {scan_id} deleted."}
