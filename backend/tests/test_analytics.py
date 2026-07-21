"""Tests for Boon analytics and compliance API endpoints."""

import pytest


class TestDashboard:
    """GET /api/v1/analytics/dashboard"""

    async def test_dashboard_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/dashboard")
        assert resp.status_code == 200

    async def test_dashboard_has_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/dashboard")
        data = resp.json()
        assert "total_facilities" in data
        assert "active_alerts" in data
        assert "total_tracked_items" in data
        assert "waste_treated_today_kg" in data
        assert "compliance_rate" in data
        assert "segregation_accuracy" in data
        assert "monthly_trend" in data
        assert "category_distribution" in data
        assert "recent_activity" in data
        assert "alerts" in data

    async def test_dashboard_total_facilities_is_eight(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/dashboard")
        assert resp.json()["total_facilities"] == 8

    async def test_dashboard_total_tracked_matches_sample(self, client, api_prefix, sample_items_count):
        resp = await client.get(f"{api_prefix}/analytics/dashboard")
        assert resp.json()["total_tracked_items"] == sample_items_count

    async def test_dashboard_compliance_rate_between_0_and_100(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/dashboard")
        rate = resp.json()["compliance_rate"]
        assert 0 <= rate <= 100

    async def test_dashboard_monthly_trend_is_list(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/dashboard")
        trend = resp.json()["monthly_trend"]
        assert isinstance(trend, list)
        assert len(trend) > 0
        for entry in trend:
            assert "month" in entry
            assert "generated" in entry
            assert "treated" in entry

    async def test_dashboard_category_distribution_is_list(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/dashboard")
        dist = resp.json()["category_distribution"]
        assert isinstance(dist, list)
        assert len(dist) > 0
        for entry in dist:
            assert "name" in entry
            assert "value" in entry
            assert "color" in entry

    async def test_dashboard_recent_activity_is_list(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/dashboard")
        activity = resp.json()["recent_activity"]
        assert isinstance(activity, list)
        if activity:
            for entry in activity:
                assert "id" in entry
                assert "source" in entry
                assert "weight_kg" in entry

    async def test_dashboard_alerts_is_list(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/dashboard")
        assert isinstance(resp.json()["alerts"], list)

    async def test_dashboard_segregation_accuracy_between_80_and_100(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/dashboard")
        acc = resp.json()["segregation_accuracy"]
        assert 80 <= acc <= 100


class TestFacilitySummaries:
    """GET /api/v1/analytics/facilities"""

    async def test_facility_summaries_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/facilities")
        assert resp.status_code == 200

    async def test_facility_summaries_has_facilities_key(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/facilities")
        assert "facilities" in resp.json()

    async def test_facility_summaries_count(self, client, api_prefix, sample_facilities_count):
        resp = await client.get(f"{api_prefix}/analytics/facilities")
        assert len(resp.json()["facilities"]) == sample_facilities_count

    async def test_facility_summaries_have_extended_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/facilities")
        for fac in resp.json()["facilities"]:
            assert "load_percentage" in fac
            assert "compliance_rate" in fac
            assert "total_waste_kg" in fac
            assert "waste_items_count" in fac

    async def test_facility_summaries_load_percentage_between_0_and_100(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/facilities")
        for fac in resp.json()["facilities"]:
            assert 0 <= fac["load_percentage"] <= 100


class TestGenerationSummary:
    """GET /api/v1/analytics/generation"""

    async def test_generation_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/generation")
        assert resp.status_code == 200

    async def test_generation_has_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/generation")
        data = resp.json()
        assert "today_total_kg" in data
        assert "today_items" in data
        assert "weekly_total_kg" in data
        assert "monthly_total_kg" in data
        assert "category_breakdown" in data
        assert "department_breakdown" in data
        assert "severity_breakdown" in data
        assert "status_breakdown" in data
        assert "compliance_score" in data
        assert "active_alerts" in data

    async def test_generation_totals_are_positive(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/generation")
        data = resp.json()
        assert data["today_total_kg"] >= 0
        assert data["weekly_total_kg"] >= 0
        assert data["monthly_total_kg"] >= 0

    async def test_generation_category_breakdown_has_all_categories(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/generation")
        cats = resp.json()["category_breakdown"]
        assert "yellow" in cats
        assert "red" in cats
        assert "white" in cats
        assert "blue" in cats

    async def test_generation_department_breakdown_has_departments(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/generation")
        depts = resp.json()["department_breakdown"]
        assert len(depts) > 0
        for dept in depts:
            assert depts[dept] >= 0

    async def test_generation_compliance_score_between_0_and_100(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/generation")
        score = resp.json()["compliance_score"]
        assert 0 <= score <= 100


class TestPredictions:
    """GET /api/v1/analytics/predictions"""

    async def test_predictions_default_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/predictions")
        assert resp.status_code == 200

    async def test_predictions_has_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/predictions")
        data = resp.json()
        assert "facility_id" in data
        assert "predictions" in data

    async def test_predictions_default_returns_7_days(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/predictions")
        assert len(resp.json()["predictions"]) == 7

    async def test_predictions_custom_days(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/predictions?days=14")
        assert len(resp.json()["predictions"]) == 14

    async def test_predictions_each_has_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/predictions")
        for pred in resp.json()["predictions"]:
            assert "date" in pred
            assert "predicted_waste_kg" in pred
            assert "confidence_interval" in pred
            assert "peak_generation_hour" in pred
            assert "recommended_collection_time" in pred

    async def test_predictions_confidence_interval_is_tuple(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/predictions")
        for pred in resp.json()["predictions"]:
            ci = pred["confidence_interval"]
            assert len(ci) == 2
            assert ci[0] <= ci[1]

    async def test_predictions_for_specific_facility(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/predictions?facility_id=FAC-003&days=3")
        data = resp.json()
        assert data["facility_id"] == "FAC-003"
        assert len(data["predictions"]) == 3


class TestComplianceReport:
    """GET /api/v1/analytics/compliance-report"""

    async def test_compliance_report_default_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/compliance-report")
        assert resp.status_code == 200

    async def test_compliance_report_has_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/compliance-report")
        data = resp.json()
        assert "report_id" in data
        assert "facility_name" in data
        assert "reporting_period" in data
        assert "total_waste_generated_kg" in data
        assert "waste_by_category" in data
        assert "treatment_efficiency" in data
        assert "segregation_accuracy" in data
        assert "compliance_score" in data
        assert "recommendations" in data
        assert "status" in data
        assert "certifiable" in data

    async def test_compliance_report_valid_status(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/compliance-report")
        status = resp.json()["status"]
        assert status in ("compliant", "non_compliant", "needs_attention")

    async def test_compliance_report_certifiable_is_boolean(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/compliance-report")
        assert isinstance(resp.json()["certifiable"], bool)

    async def test_compliance_report_has_recommendations(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/compliance-report")
        recs = resp.json()["recommendations"]
        assert isinstance(recs, list)
        assert len(recs) >= 3

    async def test_compliance_report_for_specific_facility(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/compliance-report?facility=AIIMS+Delhi")
        data = resp.json()
        assert data["facility_name"] == "AIIMS Delhi"

    async def test_compliance_report_waste_by_category(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/analytics/compliance-report")
        wbc = resp.json()["waste_by_category"]
        for cat in ("yellow", "red", "white", "blue"):
            assert cat in wbc
            assert wbc[cat] >= 0
