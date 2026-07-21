"""Boon — Waste tracking and traceability routes."""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime

from data.sample_data import SAMPLE_WASTE_ITEMS, SAMPLE_ROUTES, FACILITIES

router = APIRouter(prefix="/tracking", tags=["Tracking & Traceability"])


@router.get("/trace/{barcode}")
async def trace_waste(barcode: str):
    """Trace a waste item's full lifecycle using its barcode."""
    items = [i for i in SAMPLE_WASTE_ITEMS if i.barcode == barcode]
    if not items:
        # Try fuzzy search
        items = [i for i in SAMPLE_WASTE_ITEMS if barcode.upper() in i.barcode.upper()]

    if not items:
        raise HTTPException(status_code=404, detail=f"Barcode {barcode} not found in tracking system")

    item = items[0]

    # Build full traceability chain
    chain = [
        {
            "step": "generation",
            "status": "completed",
            "timestamp": item.generated_at.isoformat(),
            "location": item.source,
            "department": item.department,
            "handler": f"Staff - {item.department}",
            "weight_kg": item.weight_kg,
        },
    ]

    if item.collected_at:
        chain.append({
            "step": "collection",
            "status": "completed",
            "timestamp": item.collected_at.isoformat(),
            "location": item.source,
            "handler": item.collected_by or "Collection Team",
            "vehicle": item.facility,
            "weight_kg": item.weight_kg,
        })

    if item.treated_at:
        chain.append({
            "step": "treatment",
            "status": "completed",
            "timestamp": item.treated_at.isoformat(),
            "facility": item.facility or "CBWTF",
            "method": item.treatment_method or "Standard Treatment",
            "temperature": item.temperature_celsius,
        })

    if item.disposed_at:
        chain.append({
            "step": "disposal",
            "status": "completed",
            "timestamp": item.disposed_at.isoformat(),
            "method": item.disposal_method or "Secure Landfill",
            "facility": item.facility or "TSDF",
        })

    return {
        "barcode": item.barcode,
        "waste_item_id": item.id,
        "category": item.category.value,
        "waste_type": item.waste_type,
        "current_status": item.status.value,
        "severity": item.severity.value,
        "traceability_chain": chain,
        "total_steps": len(chain),
        "fully_traced": item.status.value in ["treated", "disposed"],
    }


@router.get("/live")
async def get_live_tracking():
    """Get live tracking data for all active waste in transit."""
    in_transit = [i for i in SAMPLE_WASTE_ITEMS if i.status.value == "transit"]

    return {
        "active_shipments": len(in_transit),
        "shipments": [
            {
                "id": item.id,
                "barcode": item.barcode,
                "category": item.category.value,
                "source": item.source,
                "destination": item.facility,
                "weight_kg": item.weight_kg,
                "collected_by": item.collected_by,
                "gps": {"lat": item.gps_lat, "lng": item.gps_lng},
                "temperature": item.temperature_celsius,
                "severity": item.severity.value,
            }
            for item in in_transit
        ],
    }


@router.get("/routes")
async def get_routes_with_tracking():
    """Get collection routes with real-time tracking."""
    return {
        "routes": [
            {
                "id": r.id,
                "vehicle_id": r.vehicle_id,
                "driver": {"name": r.driver_name, "phone": r.driver_phone},
                "facilities": r.facilities,
                "status": r.status,
                "total_waste_kg": r.total_waste_kg,
                "scheduled_time": r.scheduled_time.isoformat(),
                "estimated_completion": r.estimated_completion.isoformat(),
            }
            for r in SAMPLE_ROUTES
        ]
    }


@router.get("/statistics")
async def get_tracking_statistics():
    """Get tracking system statistics."""
    items = SAMPLE_WASTE_ITEMS
    total = len(items)
    traced = sum(1 for i in items if i.status.value in ["treated", "disposed"])
    in_process = total - traced
    avg_trace_time_hours = 28.5  # simulated average

    return {
        "total_items_tracked": total,
        "fully_traced": traced,
        "in_process": in_process,
        "traceability_rate": round((traced / total) * 100, 1) if total else 0,
        "average_trace_completion_hours": avg_trace_time_hours,
        "active_barcodes": total,
        "system_status": "operational",
        "blockchain_verification": True,
    }
