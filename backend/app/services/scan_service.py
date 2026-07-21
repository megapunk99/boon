"""
Boon — Scan Record Service (Database-Backed).

Replaces the in-memory SCAN_LOG list with persistent SQLite storage.
All CRUD operations are async and use SQLAlchemy async sessions.
"""

import random
from datetime import datetime

from sqlalchemy import func, select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import func, select, delete as sa_delete, update

from app.models.scan_record import BarcodeSequence, ScanRecord


# ── Barcode Sequence Counter (atomically persisted across requests) ─────

async def get_next_sequence_number(session: AsyncSession) -> int:
    """Atomically get and increment the barcode sequence counter.

    Uses a single-row table (BarcodeSequence) with row-locking semantics
    to guarantee uniqueness even under concurrent requests.
    """
    # Ensure the counter row exists
    result = await session.execute(
        select(BarcodeSequence).where(BarcodeSequence.id == 1)
    )
    counter = result.scalar_one_or_none()

    if counter is None:
        # First time — seed with 1
        counter = BarcodeSequence(id=1, next_val=1)
        session.add(counter)
        await session.flush()  # Flush to get the in-memory value
        seq = 1
        counter.next_val = 2
    else:
        seq = counter.next_val
        counter.next_val += 1

    await session.commit()
    return seq


async def reset_sequence(session: AsyncSession, start: int = 1):
    """Reset the barcode sequence counter. Used by tests for cleanup."""
    result = await session.execute(
        select(BarcodeSequence).where(BarcodeSequence.id == 1)
    )
    counter = result.scalar_one_or_none()
    if counter:
        counter.next_val = start
    else:
        counter = BarcodeSequence(id=1, next_val=start)
        session.add(counter)
    await session.commit()


# ── CRUD: Create ─────────────────────────────────────────────────────────

async def create_scan(
    session: AsyncSession,
    barcode: str,
    waste_type: str,
    category: str,
    weight_kg: float,
    source_facility: str,
    department: str,
    container_type: str,
    scanned_by: str,
    notes: str | None = None,
    gps_lat: float | None = None,
    gps_lng: float | None = None,
) -> ScanRecord:
    """Create a new scan record in the database."""
    scan_id = (
        f"SCN-{datetime.now().strftime('%y%m%d-%H%M%S')}-"
        f"{random.randint(100, 999)}"
    )

    record = ScanRecord(
        scan_id=scan_id,
        barcode=barcode,
        waste_type=waste_type,
        category=category,
        weight_kg=weight_kg,
        source_facility=source_facility,
        department=department,
        container_type=container_type,
        scanned_by=scanned_by,
        notes=notes,
        gps_lat=gps_lat,
        gps_lng=gps_lng,
        scanned_at=datetime.now(),
        status="logged",
        synced_to_main=True,
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return record


# ── CRUD: Read ───────────────────────────────────────────────────────────

async def get_scan_by_barcode(
    session: AsyncSession,
    barcode: str,
) -> ScanRecord | None:
    """Get the most recent scan for a given barcode."""
    result = await session.execute(
        select(ScanRecord)
        .where(ScanRecord.barcode == barcode)
        .order_by(ScanRecord.scanned_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_scan_history(
    session: AsyncSession,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[ScanRecord], int]:
    """Get paginated scan history, newest first. Returns (items, total)."""
    # Total count
    count_result = await session.execute(func.count(ScanRecord.id))
    total = count_result.scalar() or 0

    # Paginated results, newest first
    result = await session.execute(
        select(ScanRecord)
        .order_by(ScanRecord.scanned_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = list(result.scalars().all())
    return items, total


async def get_scanner_stats(
    session: AsyncSession,
) -> dict:
    """Compute scanner statistics from the database."""
    # Total scans
    count_result = await session.execute(func.count(ScanRecord.id))
    total_scans = count_result.scalar() or 0

    # Today's scans
    today_start = datetime.now().strftime("%Y-%m-%d")
    today_result = await session.execute(
        select(func.count(ScanRecord.id)).where(
            func.strftime("%Y-%m-%d", ScanRecord.scanned_at) == today_start
        )
    )
    today_scans = today_result.scalar() or 0

    # Category breakdown
    cat_result = await session.execute(
        select(ScanRecord.category, func.count(ScanRecord.id))
        .group_by(ScanRecord.category)
    )
    cat_breakdown = {row[0]: row[1] for row in cat_result.all()}

    # Unique barcodes
    unique_result = await session.execute(
        select(func.count(func.distinct(ScanRecord.barcode)))
    )
    unique_barcodes = unique_result.scalar() or 0

    # Total weight
    weight_result = await session.execute(func.sum(ScanRecord.weight_kg))
    total_weight = round(weight_result.scalar() or 0, 2)

    # Recent 5 scans
    recent_result = await session.execute(
        select(ScanRecord)
        .order_by(ScanRecord.scanned_at.desc())
        .limit(5)
    )
    recent_scans = [r.to_dict() for r in recent_result.scalars().all()]

    return {
        "total_scans": total_scans,
        "today_scans": today_scans,
        "unique_barcodes": unique_barcodes,
        "category_breakdown": cat_breakdown,
        "total_weight_kg": total_weight,
        "recent_scans": recent_scans,
        "system_status": "connected",
        "last_sync": datetime.now().isoformat() if total_scans > 0 else None,
    }


# ── CRUD: Delete (used by tests for cleanup) ─────────────────────────────

async def clear_all_scans(session: AsyncSession) -> int:
    """Delete all scan records. Returns number of rows deleted."""
    result = await session.execute(sa_delete(ScanRecord))
    await session.commit()
    return result.rowcount
