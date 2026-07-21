"""Boon — Waste management API routes."""

from fastapi import APIRouter, HTTPException

from app.models.schemas import WasteItem, WasteCategory, WasteStatus
from data.sample_data import SAMPLE_WASTE_ITEMS, SAMPLE_ALERTS, SAMPLE_ROUTES, FACILITIES

router = APIRouter(prefix="/waste", tags=["Waste Management"])


@router.get("/items")
async def get_all_waste_items(
    category: WasteCategory | None = None,
    status: WasteStatus | None = None,
    facility: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    """Get waste items with optional filters."""
    items = SAMPLE_WASTE_ITEMS
    if category:
        items = [i for i in items if i.category == category]
    if status:
        items = [i for i in items if i.status == status]
    if facility:
        items = [i for i in items if i.source == facility]

    total = len(items)
    items = items[offset:offset + limit]

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [i.model_dump(mode="json") for i in items],
    }


@router.get("/items/{item_id}")
async def get_waste_item(item_id: str):
    """Get a specific waste item by ID."""
    for item in SAMPLE_WASTE_ITEMS:
        if item.id == item_id:
            return item.model_dump(mode="json")
    raise HTTPException(status_code=404, detail=f"Waste item {item_id} not found")


@router.get("/categories")
async def get_categories():
    """Get all waste categories with descriptions."""
    return {
        "categories": [
            {
                "id": "yellow",
                "name": "Yellow — Infectious & Hazardous Waste",
                "color": "#FFD700",
                "description": "Human anatomical waste, animal waste, microbiology waste, cytotoxic drugs, soiled waste, discarded medicines, incineration ash",
            },
            {
                "id": "red",
                "name": "Red — Recyclable Contaminated Waste",
                "color": "#FF4444",
                "description": "IV tubing, catheters, urine bags, syringes (without needles), gloves, masks, bottles, dressing materials",
            },
            {
                "id": "white",
                "name": "White — Sharps",
                "color": "#FFFFFF",
                "description": "Hypodermic needles, scalpels, blades, surgical knives, broken glass ampoules, injection needles",
            },
            {
                "id": "blue",
                "name": "Blue — Glass & Metallic Waste",
                "color": "#4488FF",
                "description": "Glass vials, glass bottles, metallic implants, broken glassware from laboratories",
            },
        ]
    }


@router.get("/facilities")
async def get_facilities():
    """Get all registered healthcare facilities."""
    return {
        "facilities": [
            {
                "id": f.id,
                "name": f.name,
                "type": f.type,
                "city": f.city,
                "state": f.state,
                "registration": f.registration_number,
                "capacity_kg": f.capacity_kg_per_day,
                "current_load_kg": f.current_load_kg,
                "compliance_status": f.compliance_status,
                "gps": {"lat": f.gps_lat, "lng": f.gps_lng},
            }
            for f in FACILITIES
        ]
    }


@router.get("/alerts")
async def get_alerts(resolved: bool | None = None):
    """Get active/resolved alerts."""
    alerts = SAMPLE_ALERTS
    if resolved is not None:
        alerts = [a for a in alerts if (a.resolved_at is not None) == resolved]
    return {"alerts": [a.model_dump(mode="json") for a in alerts]}


@router.get("/routes")
async def get_collection_routes():
    """Get active collection routes."""
    return {"routes": [r.model_dump(mode="json") for r in SAMPLE_ROUTES]}
