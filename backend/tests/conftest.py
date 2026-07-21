"""Pytest fixtures for Boon API tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from data.sample_data import SAMPLE_WASTE_ITEMS, SAMPLE_ALERTS, SAMPLE_ROUTES, FACILITIES

API_PREFIX = "/api/v1"


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
