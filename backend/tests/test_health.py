"""Tests for Boon root and health check endpoints."""

import pytest


class TestRootEndpoint:
    """Test the GET / endpoint."""

    async def test_root_returns_200(self, client):
        resp = await client.get("/")
        assert resp.status_code == 200

    async def test_root_has_required_fields(self, client):
        resp = await client.get("/")
        data = resp.json()
        assert "app" in data
        assert "version" in data
        assert "docs" in data
        assert "status" in data

    async def test_root_status_is_operational(self, client):
        resp = await client.get("/")
        assert resp.json()["status"] == "operational"

    async def test_root_version_is_string(self, client):
        resp = await client.get("/")
        assert isinstance(resp.json()["version"], str)

    async def test_root_docs_is_string(self, client):
        resp = await client.get("/")
        assert isinstance(resp.json()["docs"], str)

    async def test_root_app_name_contains_boon(self, client):
        resp = await client.get("/")
        assert "Boon" in resp.json()["app"]


class TestHealthEndpoint:
    """Test the GET /health endpoint."""

    async def test_health_returns_200(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200

    async def test_health_has_required_fields(self, client):
        resp = await client.get("/health")
        data = resp.json()
        assert "status" in data
        assert "version" in data
        assert "ml_models" in data

    async def test_health_status_is_healthy(self, client):
        resp = await client.get("/health")
        assert resp.json()["status"] == "healthy"

    async def test_health_ml_models_has_classifier(self, client):
        resp = await client.get("/health")
        ml = resp.json()["ml_models"]
        assert "waste_classifier" in ml
        assert ml["waste_classifier"] == "loaded (simulated)"

    async def test_health_ml_models_has_predictor(self, client):
        resp = await client.get("/health")
        ml = resp.json()["ml_models"]
        assert "waste_predictor" in ml
        assert ml["waste_predictor"] == "loaded (simulated)"
