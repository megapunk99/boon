"""Tests for Boon waste management API endpoints."""

import pytest


class TestWasteItems:
    """GET /api/v1/waste/items"""

    async def test_list_items_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/items")
        assert resp.status_code == 200

    async def test_list_items_has_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/items")
        data = resp.json()
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert "items" in data

    async def test_list_items_returns_list(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/items")
        assert isinstance(resp.json()["items"], list)

    async def test_list_items_default_limit(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/items")
        data = resp.json()
        assert data["limit"] == 50
        assert data["offset"] == 0

    async def test_list_items_has_positive_total(self, client, api_prefix, sample_items_count):
        resp = await client.get(f"{api_prefix}/waste/items")
        assert resp.json()["total"] == sample_items_count

    async def test_list_items_each_has_id(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/items?limit=3")
        for item in resp.json()["items"]:
            assert "id" in item
            assert "barcode" in item
            assert "category" in item
            assert "status" in item
            assert "weight_kg" in item

    async def test_list_items_filters_by_category(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/items?category=yellow&limit=100")
        for item in resp.json()["items"]:
            assert item["category"] == "yellow"

    async def test_list_items_filters_by_status(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/items?status=generated&limit=100")
        for item in resp.json()["items"]:
            assert item["status"] == "generated"

    async def test_list_items_filters_by_facility(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/items?facility=AIIMS+Delhi&limit=100")
        for item in resp.json()["items"]:
            assert item["source"] == "AIIMS Delhi"

    async def test_list_items_pagination(self, client, api_prefix):
        resp1 = await client.get(f"{api_prefix}/waste/items?limit=5&offset=0")
        resp2 = await client.get(f"{api_prefix}/waste/items?limit=5&offset=5")
        assert len(resp1.json()["items"]) == 5
        assert len(resp2.json()["items"]) == 5
        ids1 = [i["id"] for i in resp1.json()["items"]]
        ids2 = [i["id"] for i in resp2.json()["items"]]
        assert ids1 != ids2  # Different pages


class TestWasteItemDetail:
    """GET /api/v1/waste/items/{item_id}"""

    async def test_get_item_returns_200(self, client, api_prefix, known_item_id):
        resp = await client.get(f"{api_prefix}/waste/items/{known_item_id}")
        assert resp.status_code == 200

    async def test_get_item_has_waste_fields(self, client, api_prefix, known_item_id):
        resp = await client.get(f"{api_prefix}/waste/items/{known_item_id}")
        data = resp.json()
        assert data["id"] == known_item_id
        assert "category" in data
        assert "waste_type" in data
        assert "source" in data
        assert "department" in data
        assert "weight_kg" in data
        assert "severity" in data
        assert "status" in data
        assert "barcode" in data

    async def test_get_item_404(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/items/INVALID-9999")
        assert resp.status_code == 404

    async def test_get_item_404_message(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/items/INVALID-9999")
        assert "not found" in resp.json()["detail"]


class TestWasteCategories:
    """GET /api/v1/waste/categories"""

    async def test_categories_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/categories")
        assert resp.status_code == 200

    async def test_categories_has_four_categories(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/categories")
        cats = resp.json()["categories"]
        assert len(cats) == 4

    async def test_categories_have_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/categories")
        for cat in resp.json()["categories"]:
            assert "id" in cat
            assert "name" in cat
            assert "color" in cat
            assert "description" in cat

    async def test_categories_include_all_colors(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/categories")
        colors = [c["color"] for c in resp.json()["categories"]]
        assert "#FFD700" in colors
        assert "#FF4444" in colors
        assert "#FFFFFF" in colors
        assert "#4488FF" in colors

    async def test_categories_include_yellow_red_white_blue(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/categories")
        ids = [c["id"] for c in resp.json()["categories"]]
        assert "yellow" in ids
        assert "red" in ids
        assert "white" in ids
        assert "blue" in ids


class TestFacilities:
    """GET /api/v1/waste/facilities"""

    async def test_facilities_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/facilities")
        assert resp.status_code == 200

    async def test_facilities_has_facilities_key(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/facilities")
        assert "facilities" in resp.json()

    async def test_facilities_count(self, client, api_prefix, sample_facilities_count):
        resp = await client.get(f"{api_prefix}/waste/facilities")
        assert len(resp.json()["facilities"]) == sample_facilities_count

    async def test_facilities_have_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/facilities")
        for fac in resp.json()["facilities"]:
            assert "id" in fac
            assert "name" in fac
            assert "type" in fac
            assert "city" in fac
            assert "state" in fac
            assert "registration" in fac
            assert "capacity_kg" in fac
            assert "current_load_kg" in fac
            assert "compliance_status" in fac
            assert "gps" in fac

    async def test_facilities_gps_has_lat_lng(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/facilities")
        for fac in resp.json()["facilities"]:
            assert "lat" in fac["gps"]
            assert "lng" in fac["gps"]

    async def test_facilities_includes_aiims(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/facilities")
        names = [f["name"] for f in resp.json()["facilities"]]
        assert "AIIMS Delhi" in names


class TestAlerts:
    """GET /api/v1/waste/alerts"""

    async def test_alerts_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/alerts")
        assert resp.status_code == 200

    async def test_alerts_has_alerts_key(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/alerts")
        assert "alerts" in resp.json()

    async def test_alerts_are_list(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/alerts")
        assert isinstance(resp.json()["alerts"], list)

    async def test_alerts_have_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/alerts")
        for alert in resp.json()["alerts"]:
            assert "id" in alert
            assert "type" in alert
            assert "severity" in alert
            assert "title" in alert
            assert "message" in alert
            assert "created_at" in alert

    async def test_alerts_filter_resolved(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/alerts?resolved=true")
        for alert in resp.json()["alerts"]:
            assert alert["resolved_at"] is not None

    async def test_alerts_filter_unresolved(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/alerts?resolved=false")
        for alert in resp.json()["alerts"]:
            assert alert["resolved_at"] is None

    async def test_alerts_count(self, client, api_prefix, sample_alerts_count):
        resp = await client.get(f"{api_prefix}/waste/alerts")
        assert len(resp.json()["alerts"]) == sample_alerts_count


class TestRoutes:
    """GET /api/v1/waste/routes"""

    async def test_routes_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/routes")
        assert resp.status_code == 200

    async def test_routes_has_routes_key(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/routes")
        assert "routes" in resp.json()

    async def test_routes_count(self, client, api_prefix, sample_routes_count):
        resp = await client.get(f"{api_prefix}/waste/routes")
        assert len(resp.json()["routes"]) == sample_routes_count

    async def test_routes_have_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/routes")
        for route in resp.json()["routes"]:
            assert "id" in route
            assert "vehicle_id" in route
            assert "driver_name" in route
            assert "driver_phone" in route
            assert "facilities" in route
            assert "status" in route
            assert "total_waste_kg" in route
            assert "scheduled_time" in route
            assert "estimated_completion" in route

    async def test_routes_have_string_facilities(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/waste/routes")
        for route in resp.json()["routes"]:
            assert isinstance(route["facilities"], list)
            assert len(route["facilities"]) > 0
