"""Tests for Boon tracking and traceability API endpoints."""

import pytest


class TestBarcodeTrace:
    """GET /api/v1/tracking/trace/{barcode}"""

    async def test_trace_returns_200(self, client, api_prefix, known_barcode):
        resp = await client.get(f"{api_prefix}/tracking/trace/{known_barcode}")
        assert resp.status_code == 200

    async def test_trace_has_required_fields(self, client, api_prefix, known_barcode):
        resp = await client.get(f"{api_prefix}/tracking/trace/{known_barcode}")
        data = resp.json()
        assert "barcode" in data
        assert "waste_item_id" in data
        assert "category" in data
        assert "waste_type" in data
        assert "current_status" in data
        assert "severity" in data
        assert "traceability_chain" in data
        assert "total_steps" in data
        assert "fully_traced" in data

    async def test_trace_returns_correct_barcode(self, client, api_prefix, known_barcode):
        resp = await client.get(f"{api_prefix}/tracking/trace/{known_barcode}")
        assert resp.json()["barcode"] == known_barcode

    async def test_trace_chain_is_list_of_steps(self, client, api_prefix, known_barcode):
        resp = await client.get(f"{api_prefix}/tracking/trace/{known_barcode}")
        chain = resp.json()["traceability_chain"]
        assert isinstance(chain, list)
        assert len(chain) >= 1
        for step in chain:
            assert "step" in step
            assert "status" in step
            assert "timestamp" in step

    async def test_trace_first_step_is_generation(self, client, api_prefix, known_barcode):
        resp = await client.get(f"{api_prefix}/tracking/trace/{known_barcode}")
        first = resp.json()["traceability_chain"][0]
        assert first["step"] == "generation"
        assert first["status"] == "completed"

    async def test_trace_fully_traced_is_boolean(self, client, api_prefix, known_barcode):
        resp = await client.get(f"{api_prefix}/tracking/trace/{known_barcode}")
        assert isinstance(resp.json()["fully_traced"], bool)

    async def test_trace_404_for_unknown_barcode(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/trace/UNKNOWN-BARCODE-99999")
        assert resp.status_code == 404

    async def test_trace_fuzzy_search_finds_barcode(self, client, api_prefix):
        """Partial barcode should still match via fuzzy search."""
        resp = await client.get(f"{api_prefix}/tracking/trace/BOON-001")
        assert resp.status_code == 200
        assert "barcode" in resp.json()


class TestLiveTracking:
    """GET /api/v1/tracking/live"""

    async def test_live_tracking_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/live")
        assert resp.status_code == 200

    async def test_live_tracking_has_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/live")
        data = resp.json()
        assert "active_shipments" in data
        assert "shipments" in data

    async def test_live_tracking_shipments_is_list(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/live")
        assert isinstance(resp.json()["shipments"], list)

    async def test_live_tracking_shipments_have_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/live")
        for s in resp.json()["shipments"]:
            assert "id" in s
            assert "barcode" in s
            assert "category" in s
            assert "source" in s
            assert "gps" in s
            assert "severity" in s

    async def test_live_tracking_shipments_gps(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/live")
        for s in resp.json()["shipments"]:
            assert "lat" in s["gps"]
            assert "lng" in s["gps"]

    async def test_live_tracking_active_shipments_is_int(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/live")
        assert isinstance(resp.json()["active_shipments"], int)


class TestTrackingRoutes:
    """GET /api/v1/tracking/routes"""

    async def test_tracking_routes_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/routes")
        assert resp.status_code == 200

    async def test_tracking_routes_have_driver_info(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/routes")
        for r in resp.json()["routes"]:
            assert "driver" in r
            assert "name" in r["driver"]
            assert "phone" in r["driver"]


class TestTrackingStatistics:
    """GET /api/v1/tracking/statistics"""

    async def test_tracking_stats_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/statistics")
        assert resp.status_code == 200

    async def test_tracking_stats_has_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/statistics")
        data = resp.json()
        assert "total_items_tracked" in data
        assert "fully_traced" in data
        assert "in_process" in data
        assert "traceability_rate" in data
        assert "system_status" in data

    async def test_tracking_stats_total_matches_sample(self, client, api_prefix, sample_items_count):
        resp = await client.get(f"{api_prefix}/tracking/statistics")
        assert resp.json()["total_items_tracked"] == sample_items_count

    async def test_tracking_stats_system_operational(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/statistics")
        assert resp.json()["system_status"] == "operational"

    async def test_tracking_stats_fully_traced_plus_in_process_equals_total(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/statistics")
        data = resp.json()
        assert data["fully_traced"] + data["in_process"] == data["total_items_tracked"]

    async def test_tracking_stats_blockchain_verified(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/statistics")
        assert resp.json()["blockchain_verification"] is True

    async def test_tracking_stats_traceability_rate_is_percentage(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/tracking/statistics")
        rate = resp.json()["traceability_rate"]
        assert 0 <= rate <= 100
