"""Boon — ML model API routes."""

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.ml.waste_classifier import get_model
from app.ml.predictor import get_predictor

router = APIRouter(prefix="/ml", tags=["ML Models"])
model = get_model()
predictor = get_predictor()


@router.get("/classifier/info")
async def get_classifier_info():
    """Get WasteNet model metadata and performance metrics."""
    return model.get_model_info()


@router.get("/predictor/info")
async def get_predictor_info():
    """Get ForecastNet model metadata and features."""
    return predictor.get_model_info()


@router.get("/predictor/forecast")
async def get_forecast(
    facility: str = Query("AIIMS Delhi", description="Facility name"),
    daily_kg: float = Query(200, description="Current daily waste in kg"),
    days: int = Query(7, description="Forecast days"),
):
    """Get waste generation forecast for a facility."""
    return predictor.predict(facility, daily_kg, days)
