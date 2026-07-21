"""
Boon — Scan Record ORM Model.

Represents a single scanned/logged waste item in the database.
Maps one-to-one with the fields in ScannerApi's ScanLogRequest.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BarcodeSequence(Base):
    """Persistent atomic counter for barcode generation.

    A single-row table holding the current sequence value.
    Updated atomically to avoid collisions between concurrent requests.
    """

    __tablename__ = "barcode_sequence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    next_val: Mapped[int] = mapped_column(Integer, nullable=False, default=1)


class ScanRecord(Base):
    """A logged scan entry for a biomedical waste QR code / barcode."""

    __tablename__ = "scan_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scan_id: Mapped[str] = mapped_column(
        String(32), nullable=False, index=True, unique=True,
        comment="Human-readable ID e.g. SCN-250721-143022-452",
    )
    barcode: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True,
        comment="Unique waste barcode (BOON-XXXX-...)",
    )
    waste_type: Mapped[str] = mapped_column(String(64), nullable=False)
    category: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    source_facility: Mapped[str] = mapped_column(String(128), nullable=False)
    department: Mapped[str] = mapped_column(String(64), nullable=False)
    container_type: Mapped[str] = mapped_column(String(32), nullable=False)
    scanned_by: Mapped[str] = mapped_column(String(64), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    gps_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    gps_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    scanned_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.now,
    )
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="logged",
    )
    synced_to_main: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(),
    )

    def to_dict(self) -> dict:
        """Serialize to the same dict format the in-memory list used."""
        return {
            "id": self.scan_id,
            "barcode": self.barcode,
            "waste_type": self.waste_type,
            "category": self.category,
            "weight_kg": self.weight_kg,
            "source_facility": self.source_facility,
            "department": self.department,
            "container_type": self.container_type,
            "scanned_by": self.scanned_by,
            "notes": self.notes,
            "gps_lat": self.gps_lat,
            "gps_lng": self.gps_lng,
            "scanned_at": self.scanned_at.isoformat() if self.scanned_at else None,
            "status": self.status,
            "synced_to_main": self.synced_to_main,
        }
