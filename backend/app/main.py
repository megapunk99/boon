"""Boon — Biomedical Waste Management & Tracking Platform Backend.

A FastAPI-powered API that provides:
- AI-powered waste classification
- Real-time waste tracking and traceability
- Analytics and compliance reporting
- ML-based waste generation forecasting
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
# Import all models so they register with Base.metadata before init_db()
# (keeping imports here avoids circular dependency with database.py)
import app.models.scan_record  # noqa: F401
import app.models.cpcb_report  # noqa: F401

from app.routes import waste, analytics, classify, tracking, ml_routes, scanner, sathi
from app.routes.admin import router as admin_router
from app.auth.router import router as auth_router
from app.database import init_db, close_db
from app.auth.setup import ensure_admin_exists

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
app.include_router(auth_router, prefix=api_prefix)
app.include_router(admin_router, prefix=api_prefix)


# ── Serve Mobile Scanner App as Static Files ──────────────────────────────
# Mount the standalone scanner app at /scanner so it's accessible from any
# device on the network (phone, tablet, etc.) via http://<ip>:8000/scanner/
SCANNER_DIR = Path(__file__).resolve().parent.parent.parent / "scanner"
if SCANNER_DIR.exists():
    app.mount("/scanner", StaticFiles(directory=str(SCANNER_DIR), html=True), name="scanner")
else:
    print(f"Warning: Scanner directory not found at {SCANNER_DIR}")


@app.get("/")
async def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "scanner_app": "/scanner/",
        "status": "operational",
    }


@app.get("/health")
@app.get(api_prefix + "/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.app_version,
        "ml_models": {
            "waste_classifier": "loaded (simulated)",
            "waste_predictor": "loaded (simulated)",
        },
    }



@app.on_event("startup")
async def on_startup():
    """Initialize database tables and ensure admin user exists on first run."""
    await init_db()
    await ensure_admin_exists()


@app.on_event("shutdown")
async def on_shutdown():
    """Close database connection on shutdown."""
    await close_db()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
