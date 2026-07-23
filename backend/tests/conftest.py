"""
Pytest fixtures for Boon API tests.

Sets up an in-memory SQLite database for test isolation.
IMPORTANT: The BOON_DATABASE_URL env var must be set BEFORE app.database is imported.
"""

import os

# ── Must be set before ANY app.database imports ──────────────────────────
# This ensures database.py reads the in-memory URL at module-load time.
os.environ["BOON_DATABASE_URL"] = "sqlite+aiosqlite://"

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.database import init_db, drop_db, close_db, SessionLocal
from app.services import scan_service
from app.models.cpcb_report import CPCBReport
from data.sample_data import SAMPLE_WASTE_ITEMS, SAMPLE_ALERTS, SAMPLE_ROUTES, FACILITIES

API_PREFIX = "/api/v1"


# ── Initialize database once per test session ────────────────────────────
@pytest.fixture(scope="session", autouse=True)
async def _setup_database():
    """Create all tables before tests, drop and close after."""
    await init_db()
    yield
    await drop_db()
    await close_db()


# ── Clean scan_log + sequence table before each test ─────────────────────
@pytest.fixture(autouse=True)
async def _clean_database():
    """Clear all scan records, CPCB reports, and reset barcode sequence before each test."""
    async with SessionLocal() as session:
        await scan_service.clear_all_scans(session)
        await scan_service.reset_sequence(session, start=1)
        # Clear CPCB reports to avoid UNIQUE constraint violations
        from sqlalchemy import delete
        await session.execute(delete(CPCBReport))
        await session.commit()


@pytest.fixture
def api_prefix() -> str:
    return API_PREFIX


@pytest.fixture
async def client():
    """Create an async test client for the Boon FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def sample_items_count() -> int:
    return len(SAMPLE_WASTE_ITEMS)


@pytest.fixture
def sample_alerts_count() -> int:
    return len(SAMPLE_ALERTS)


@pytest.fixture
def sample_routes_count() -> int:
    return len(SAMPLE_ROUTES)


@pytest.fixture
def sample_facilities_count() -> int:
    return len(FACILITIES)


@pytest.fixture
def known_barcode() -> str:
    """Return a barcode that exists in sample data."""
    return SAMPLE_WASTE_ITEMS[0].barcode


@pytest.fixture
def known_item_id() -> str:
    """Return an item ID that exists in sample data."""
    return SAMPLE_WASTE_ITEMS[0].id


@pytest.fixture
def known_facility_name() -> str:
    return FACILITIES[0].name
