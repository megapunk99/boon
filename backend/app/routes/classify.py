"""Boon — AI-powered waste classification routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.classifier import WasteClassifier

router = APIRouter(prefix="/classify", tags=["AI Classification"])
classifier = WasteClassifier()


class ClassifyRequest(BaseModel):
    waste_type: str
    image_b64: str | None = None


class BatchClassifyRequest(BaseModel):
    items: list[ClassifyRequest]


@router.post("/")
async def classify_waste(request: ClassifyRequest):
    """Classify biomedical waste using AI-powered knowledge engine.

    Provide the waste type (e.g. 'hypodermic_needles', 'iv_tubing', 'blood_bags')
    and optionally a base64-encoded image for CNN-based analysis.
    """
    result = await classifier.classify(request.waste_type, request.image_b64)
    return result.model_dump(mode="json")


@router.post("/batch")
async def classify_batch(request: BatchClassifyRequest):
    """Classify multiple waste items in a single batch request."""
    items = [(item.waste_type, item.image_b64) for item in request.items]
    results = await classifier.classify_batch(items)
    return {"results": [r.model_dump(mode="json") for r in results]}


@router.get("/categories")
async def get_classification_categories():
    """Get all waste categories with treatment and disposal info."""
    return {"categories": classifier.get_all_categories_info()}


@router.get("/guide/{category}")
async def get_treatment_guide(category: str):
    """Get treatment and disposal guidelines for a waste category."""
    from app.models.schemas import WasteCategory

    try:
        cat = WasteCategory(category.lower())
    except ValueError:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown category: {category}. Valid: yellow, red, white, blue",
        )

    return {
        "category": category,
        "treatment": classifier.get_treatment_guide(cat),
        "guidelines": classifier.get_disposal_guidelines(cat),
    }
