"""Boon — Biomedical Waste Management & Tracking Platform Backend.

A FastAPI-powered API that provides:
- AI-powered waste classification
- Real-time waste tracking and traceability
- Analytics and compliance reporting
- ML-based waste generation forecasting
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import waste, analytics, classify, tracking, ml_routes, scanner, sathi

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Computational Intelligence for Sustainable Biomedical Waste Management in India",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=settings.cors_origins_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ──────────────────────────────────────────────────────
api_prefix = settings.api_prefix
app.include_router(waste.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(classify.router, prefix=api_prefix)
app.include_router(tracking.router, prefix=api_prefix)
app.include_router(ml_routes.router, prefix=api_prefix)
app.include_router(scanner.router, prefix=api_prefix)
app.include_router(sathi.router, prefix=api_prefix)


@app.get("/")
async def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "status": "operational",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.app_version,
        "ml_models": {
            "waste_classifier": "loaded (simulated)",
            "waste_predictor": "loaded (simulated)",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
