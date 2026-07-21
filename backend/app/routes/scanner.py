"""Boon — Scanner & QR Code Management API.

Endpoints for the standalone scanner app that captures waste data
via camera, generates QR codes, and logs items to the Boon system.
"""

import hashlib
import io
import base64
import json
import qrcode
import random
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from data.sample_data import SAMPLE_WASTE_ITEMS
from data.real_india_data import (
    get_real_india_stats, get_state_wise_summary, get_segregation_guide,
    REAL_INDIAN_HOSPITALS, INDIAN_BMW_CATEGORIES,
)
from app.services.blockchain_service import sathi_network

router = APIRouter(prefix="/scanner", tags=["Scanner & QR"])

# ── In-memory scan log (for demo; uses DB in production) ────────────────
SCAN_LOG: list[dict] = []
_SEQ_COUNTER: int = 0  # Global sequential counter for barcode generation


# ── Request / Response Models ────────────────────────────────────────────

class ScanLogRequest(BaseModel):
    barcode: str
    waste_type: str
    category: str
    weight_kg: float
    source_facility: str
    department: str
    container_type: str
    scanned_by: str
    notes: str | None = None
    gps_lat: float | None = None
    gps_lng: float | None = None


class QRGenerateRequest(BaseModel):
    waste_type: str
    category: str
    source_facility: str
    department: str
    weight_kg: float
    container_type: str
    handler_name: str | None = None


# ── Barcode Generation ───────────────────────────────────────────────────

def generate_barcode(category: str, facility_code: str, seq: int) -> str:
    """Generate a unique, collision-resistant CPCB-compliant barcode.
    
    Format: BOON-{FAC_HASH}-{CAT}-{DATE}-{SEQ}
    Uses MD5 hash of facility name to avoid collisions (AIIMS Delhi vs AIIMS Bangalore).
    """
    date_str = datetime.now().strftime("%y%m%d")
    # Use first 4 hex chars of MD5 hash for collision resistance
    fac_hash = hashlib.md5(facility_code.encode()).hexdigest()[:4].upper()
    cat_code = category[:2].upper()
    return f"BOON-{fac_hash}-{cat_code}-{date_str}-{seq:05d}"


# ── API Endpoints ────────────────────────────────────────────────────────

@router.get("/real-data")
async def get_real_india_data():
    """Get real Indian biomedical waste statistics from CPCB."""
    return get_real_india_stats()


@router.get("/real-data/state-wise")
async def get_state_wise():
    """Get state-wise waste generation statistics for India."""
    states = get_state_wise_summary()
    return {
        "states": states,
        "total_tpd": round(sum(s["waste_tpd"] for s in states), 1),
    }


@router.get("/real-data/segregation-guide")
async def get_segregation():
    """Get waste segregation guide per BMW Rules 2016."""
    return {"guide": get_segregation_guide()}


@router.get("/real-data/hospitals")
async def get_hospitals():
    """Get real Indian hospital data."""
    return {"hospitals": REAL_INDIAN_HOSPITALS, "count": len(REAL_INDIAN_HOSPITALS)}


@router.get("/real-data/categories")
async def get_categories():
    """Get Indian BMW categories per Rules 2016."""
    return {"categories": INDIAN_BMW_CATEGORIES}


@router.post("/generate-qr")
async def generate_qr(request: QRGenerateRequest):
    """Generate a QR code for a new waste item.

    Returns the QR code as a base64 PNG data URL along with
    the generated barcode and metadata for printing.
    """
    # Generate unique barcode with deterministic sequential ID
    global _SEQ_COUNTER
    _SEQ_COUNTER += 1
    barcode = generate_barcode(
        request.category, request.source_facility, _SEQ_COUNTER
    )

    # Create QR data payload
    qr_payload = json.dumps({
        "barcode": barcode,
        "type": "biomedical_waste",
        "waste_type": request.waste_type,
        "category": request.category,
        "source": request.source_facility,
        "department": request.department,
        "weight_kg": request.weight_kg,
        "container": request.container_type,
        "generated_at": datetime.now().isoformat(),
        "system": "Boon",
    })

    # Generate QR image
    qr = qrcode.QRCode(
        version=2,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(qr_payload)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # Convert to base64 PNG
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    data_url = f"data:image/png;base64,{img_b64}"

    # Auto-register on Sāthī Network blockchain
    blockchain_ok = False
    try:
        sathi_network.register_waste_item(barcode)
        sathi_network.record_handoff(
            barcode=barcode,
            event="generation",
            actor=request.handler_name or "Scanner Operator",
            location=request.source_facility,
            metadata={
                "waste_type": request.waste_type,
                "category": request.category,
                "department": request.department,
                "weight_kg": request.weight_kg,
                "container": request.container_type,
            },
        )
        blockchain_ok = True
    except (ImportError, AttributeError, TypeError) as e:
        print(f"Warning: Sāthī blockchain registration failed for {barcode}: {e}")

    return {
        "success": True,
        "barcode": barcode,
        "qr_data_url": data_url,
        "qr_payload": qr_payload,
        "blockchain_registered": blockchain_ok,
        "sathi_trace_url": f"/sathi?barcode={barcode}",
        "metadata": {
            "waste_type": request.waste_type,
            "category": request.category,
            "source": request.source_facility,
            "department": request.department,
            "weight_kg": request.weight_kg,
            "container": request.container_type,
            "generated_at": datetime.now().isoformat(),
        },
        "print_info": {
            "label_size": "2x2 inches",
            "recommended_position": "Waste container label",
            "durable_material": "Polyester with permanent adhesive",
        },
    }


@router.post("/log-scan")
async def log_scan(request: ScanLogRequest):
    """Log a scanned waste item into the tracking system.

    This syncs data from the scanner app to the main Boon system.
    """
    scan_entry = {
        "id": f"SCN-{datetime.now().strftime('%y%m%d-%H%M%S')}-{random.randint(100, 999)}",
        "barcode": request.barcode,
        "waste_type": request.waste_type,
        "category": request.category,
        "weight_kg": request.weight_kg,
        "source_facility": request.source_facility,
        "department": request.department,
        "container_type": request.container_type,
        "scanned_by": request.scanned_by,
        "notes": request.notes,
        "gps_lat": request.gps_lat,
        "gps_lng": request.gps_lng,
        "scanned_at": datetime.now().isoformat(),
        "status": "logged",
        "synced_to_main": True,
    }

    SCAN_LOG.append(scan_entry)

    return {
        "success": True,
        "message": "Waste item logged successfully and synced to Boon system",
        "scan_entry": scan_entry,
        "main_system_barcode": request.barcode,
        "tracking_url": f"/api/v1/tracking/trace/{request.barcode}",
    }


@router.get("/verify/{barcode}")
async def verify_barcode(barcode: str):
    """Verify a barcode/QR code against the Boon tracking system.

    Checks if the barcode exists in the main system or scan log.
    """
    # Check main system
    main_items = [i for i in SAMPLE_WASTE_ITEMS if barcode.upper() in i.barcode.upper()]
    if main_items:
        item = main_items[0]
        return {
            "verified": True,
            "source": "main_system",
            "barcode": item.barcode,
            "status": item.status.value,
            "category": item.category.value,
            "waste_type": item.waste_type,
            "weight_kg": item.weight_kg,
            "facility": item.source,
            "department": item.department,
            "generated_at": item.generated_at.isoformat(),
            "trace_url": f"/api/v1/tracking/trace/{item.barcode}",
        }

    # Check scan log
    scan_items = [s for s in SCAN_LOG if s["barcode"] == barcode]
    if scan_items:
        entry = scan_items[-1]
        return {
            "verified": True,
            "source": "scanner_app",
            "barcode": entry["barcode"],
            "status": entry["status"],
            "category": entry["category"],
            "waste_type": entry["waste_type"],
            "weight_kg": entry["weight_kg"],
            "facility": entry["source_facility"],
            "department": entry["department"],
            "generated_at": entry["scanned_at"],
            "trace_url": f"/api/v1/tracking/trace/{entry['barcode']}",
        }

    # Not found
    return {
        "verified": False,
        "source": None,
        "message": "Barcode not found in any Boon system. This may be an unregistered item.",
        "suggestion": "Use the scanner app to register this waste item and generate a new Boon QR code.",
    }


@router.get("/history")
async def get_scan_history(
    limit: int = Query(20, description="Number of recent scans to return"),
    offset: int = Query(0, description="Offset for pagination"),
):
    """Get the history of scanned and logged waste items."""
    total = len(SCAN_LOG)
    items = list(reversed(SCAN_LOG))[offset:offset + limit]

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": items,
        "count": len(items),
    }


@router.get("/stats")
async def get_scanner_stats():
    """Get scanner app statistics."""
    total_scans = len(SCAN_LOG)
    today_scans = sum(
        1 for s in SCAN_LOG
        if s["scanned_at"].startswith(datetime.now().strftime("%Y-%m-%d"))
    )

    # Category breakdown
    cat_breakdown: dict[str, int] = {}
    for s in SCAN_LOG:
        cat_breakdown[s["category"]] = cat_breakdown.get(s["category"], 0) + 1

    recent_scans = list(reversed(SCAN_LOG))[:5]

    return {
        "total_scans": total_scans,
        "today_scans": today_scans,
        "unique_barcodes": len(set(s["barcode"] for s in SCAN_LOG)),
        "category_breakdown": cat_breakdown,
        "total_weight_kg": round(sum(s["weight_kg"] for s in SCAN_LOG), 2),
        "recent_scans": recent_scans,
        "system_status": "connected",
        "last_sync": datetime.now().isoformat() if SCAN_LOG else None,
    }
