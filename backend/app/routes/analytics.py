"""Boon — Analytics and compliance API routes."""

from fastapi import APIRouter, Query

from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & Compliance"])
service = AnalyticsService()


@router.get("/dashboard")
async def get_dashboard():
    """Get real-time dashboard statistics."""
    return service.get_dashboard_stats().model_dump(mode="json")


@router.get("/facilities")
async def get_facility_summaries():
    """Get compliance summaries for all facilities."""
    return {"facilities": service.get_facility_summary()}


@router.get("/generation")
async def get_generation_summary():
    """Get waste generation summary for analytics."""
    return service.get_generation_summary().model_dump(mode="json")


@router.get("/predictions")
async def get_predictions(
    facility_id: str = Query("FAC-001", description="Facility ID"),
    days: int = Query(7, description="Number of days to predict"),
):
    """Get ML-based waste generation predictions for a facility."""
    predictions = service.get_predictions(facility_id, days)
    return {
        "facility_id": facility_id,
        "predictions": [p.model_dump(mode="json") for p in predictions],
    }


@router.get("/compliance-report")
async def get_compliance_report(
    facility: str | None = Query(None, description="Facility name"),
):
    """Generate a CPCB-compliant compliance report for a facility."""
    report = service.generate_compliance_report(facility)
    return report.model_dump(mode="json")
