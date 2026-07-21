"""Tests for Sāthī Network API endpoints — blockchain, compliance, marketplace."""

import pytest


class TestSathiDashboard:
    """GET /api/v1/sathi/dashboard"""

    async def test_dashboard_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/dashboard")
        assert resp.status_code == 200

    async def test_dashboard_has_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/dashboard")
        data = resp.json()
        assert "total_waste_items_tracked" in data
        assert "total_blocks_mined" in data
        assert "integrity_rate" in data
        assert "network_status" in data
        assert "registered_facilities" in data
        assert "total_compliance_reports" in data

    async def test_dashboard_network_operational(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/dashboard")
        assert resp.json()["network_status"] == "operational"

    async def test_dashboard_integrity_rate_is_percentage(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/dashboard")
        rate = resp.json()["integrity_rate"]
        assert 0 <= rate <= 100

    async def test_dashboard_has_facilities_list(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/dashboard")
        assert "facilities" in resp.json()
        assert len(resp.json()["facilities"]) > 0

    async def test_dashboard_facilities_have_scores(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/dashboard")
        for fac in resp.json()["facilities"]:
            assert "compliance_score" in fac
            assert "name" in fac
            assert "city" in fac
            assert "state" in fac

    async def test_dashboard_has_recent_activity(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/dashboard")
        assert "recent_activity" in resp.json()
        assert len(resp.json()["recent_activity"]) > 0

    async def test_dashboard_network_coverage(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/dashboard")
        cov = resp.json().get("network_coverage", {})
        assert "states_covered" in cov
        assert "cities_covered" in cov
        assert "total_hospitals" in cov


class TestBlockchainExplorer:
    """GET /api/v1/sathi/explorer/*"""

    async def test_explorer_stats_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/explorer/stats")
        assert resp.status_code == 200

    async def test_explorer_stats_has_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/explorer/stats")
        data = resp.json()
        assert "total_chains" in data
        assert "total_blocks" in data
        assert "chain_integrity" in data
        assert "algorithm" in data

    async def test_explorer_stats_algorithm_sha256(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/explorer/stats")
        assert resp.json()["algorithm"] == "SHA-256"

    async def test_explorer_stats_total_chains_is_int(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/explorer/stats")
        assert isinstance(resp.json()["total_chains"], int)

    async def test_explorer_chain_known_barcode_returns_200(self, client, api_prefix, known_barcode):
        """Sample waste items should have blockchain entries from seeding."""
        resp = await client.get(f"{api_prefix}/sathi/explorer/chain/{known_barcode}")
        assert resp.status_code == 200

    async def test_explorer_chain_has_blocks(self, client, api_prefix, known_barcode):
        resp = await client.get(f"{api_prefix}/sathi/explorer/chain/{known_barcode}")
        data = resp.json()
        assert "chain" in data
        assert len(data["chain"]) >= 1

    async def test_explorer_chain_verification(self, client, api_prefix, known_barcode):
        resp = await client.get(f"{api_prefix}/sathi/explorer/chain/{known_barcode}")
        data = resp.json()
        assert data.get("verification", {}).get("is_valid") is True
        assert "merkle_root" in data

    async def test_explorer_chain_blocks_have_fields(self, client, api_prefix, known_barcode):
        resp = await client.get(f"{api_prefix}/sathi/explorer/chain/{known_barcode}")
        for block in resp.json()["chain"]:
            assert "index" in block
            assert "timestamp" in block
            assert "data" in block
            assert "previous_hash" in block
            assert "hash" in block

    async def test_explorer_chain_hashes_are_valid(self, client, api_prefix, known_barcode):
        """Each block's hash should link to the next block's previous_hash."""
        chain = (await client.get(
            f"{api_prefix}/sathi/explorer/chain/{known_barcode}"
        )).json()["chain"]
        for i in range(1, len(chain)):
            assert chain[i]["previous_hash"] == chain[i - 1]["hash"]

    async def test_explorer_chain_404_for_unknown(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/explorer/chain/UNKNOWN-BARCODE-99999")
        assert resp.status_code == 404

    async def test_explorer_search_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/explorer/search?query=AIIMS")
        assert resp.status_code == 200

    async def test_explorer_search_has_results(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/explorer/search?query=BOON")
        data = resp.json()
        assert "query" in data
        assert "results_count" in data
        assert "results" in data

    async def test_explorer_search_by_barcode_finds_results(self, client, api_prefix, known_barcode):
        barcode_prefix = known_barcode.split("-")[0]
        resp = await client.get(f"{api_prefix}/sathi/explorer/search?query={barcode_prefix}")
        assert resp.json()["results_count"] > 0

    async def test_explorer_search_422_without_query(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/explorer/search")
        assert resp.status_code == 422


class TestSathiHandoff:
    """POST /api/v1/sathi/handoff"""

    HANDOFF_PAYLOAD = {
        "barcode": "HANDOFF-TEST-BC-001",
        "event": "collection",
        "actor": "Collection Team",
        "location": "AIIMS New Delhi - ICU",
        "weight_kg": 2.5,
        "category": "yellow",
        "waste_type": "soiled_dressing",
    }

    async def test_handoff_records_new_item(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/sathi/handoff", json=self.HANDOFF_PAYLOAD)
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "block" in data

    async def test_handoff_creates_blockchain(self, client, api_prefix):
        barcode = "HANDOFF-NEW-CHAIN-001"
        resp = await client.post(f"{api_prefix}/sathi/handoff", json={
            **self.HANDOFF_PAYLOAD, "barcode": barcode, "event": "generation",
        })
        assert resp.json()["success"] is True

        # Verify chain was created
        chain_resp = await client.get(f"{api_prefix}/sathi/explorer/chain/{barcode}")
        assert chain_resp.status_code == 200
        assert len(chain_resp.json()["chain"]) >= 1

    async def test_handoff_verification_in_response(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/sathi/handoff", json={
            **self.HANDOFF_PAYLOAD, "barcode": "HANDOFF-VERIFY-001", "event": "segregation",
        })
        data = resp.json()
        assert "verification" in data
        assert data["verification"]["is_valid"] is True

    async def test_handoff_adds_to_existing_chain(self, client, api_prefix):
        """Multiple handoffs for same barcode should extend the chain."""
        barcode = "HANDOFF-MULTI-001"
        await client.post(f"{api_prefix}/sathi/handoff", json={
            **self.HANDOFF_PAYLOAD, "barcode": barcode, "event": "generation",
        })
        await client.post(f"{api_prefix}/sathi/handoff", json={
            **self.HANDOFF_PAYLOAD, "barcode": barcode, "event": "collection",
        })
        await client.post(f"{api_prefix}/sathi/handoff", json={
            **self.HANDOFF_PAYLOAD, "barcode": barcode, "event": "treatment",
        })

        chain_resp = await client.get(f"{api_prefix}/sathi/explorer/chain/{barcode}")
        chain = chain_resp.json()["chain"]
        assert len(chain) == 4  # genesis + 3 handoffs
        events = [b["data"]["event"] for b in chain]
        assert events == ["generation", "generation", "collection", "treatment"]

    async def test_handoff_422_on_missing_fields(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/sathi/handoff", json={})
        assert resp.status_code == 422


class TestCompliance:
    """GET /api/v1/sathi/compliance/*"""

    async def test_compliance_overview_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/compliance/overview")
        assert resp.status_code == 200

    async def test_compliance_overview_has_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/compliance/overview")
        data = resp.json()
        assert "total_facilities" in data
        assert "average_compliance_score" in data
        assert "status_breakdown" in data
        assert "facilities" in data
        assert "network_health" in data

    async def test_compliance_overview_score_is_percentage(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/compliance/overview")
        score = resp.json()["average_compliance_score"]
        assert 0 <= score <= 100

    async def test_compliance_status_breakdown(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/compliance/overview")
        breakdown = resp.json()["status_breakdown"]
        assert "compliant" in breakdown
        assert "needs_attention" in breakdown
        assert "non_compliant" in breakdown

    async def test_compliance_overview_facilities_have_scores(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/compliance/overview")
        for fac in resp.json()["facilities"]:
            assert "compliance_score" in fac
            assert "status" in fac
            assert "name" in fac

    async def test_compliance_facility_detail_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/compliance/facility/FAC-001")
        assert resp.status_code == 200

    async def test_compliance_facility_detail_has_metrics(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/compliance/facility/FAC-001")
        data = resp.json()
        assert "facility" in data
        assert "compliance_score" in data
        assert "metrics" in data
        assert "overall_metric" in data

    async def test_compliance_facility_metrics_are_percentages(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/compliance/facility/FAC-001")
        for name, val in resp.json()["metrics"].items():
            assert 0 <= val <= 100, f"Metric '{name}' out of range: {val}"

    async def test_compliance_facility_has_violations(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/compliance/facility/FAC-001")
        data = resp.json()
        assert "violations" in data
        assert "violations_count" in data
        assert isinstance(data["violations"], list)

    async def test_compliance_facility_404_for_unknown(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/compliance/facility/UNKNOWN-999")
        assert resp.status_code == 404


class TestAIEnforcement:
    """POST /api/v1/sathi/ai/enforce"""

    async def test_ai_enforce_returns_200_for_known_barcode(self, client, api_prefix, known_barcode):
        resp = await client.post(
            f"{api_prefix}/sathi/ai/enforce",
            params={"barcode": known_barcode},
        )
        assert resp.status_code == 200

    async def test_ai_enforce_has_audit_fields(self, client, api_prefix, known_barcode):
        resp = await client.post(
            f"{api_prefix}/sathi/ai/enforce",
            params={"barcode": known_barcode},
        )
        data = resp.json()
        assert "ai_audit_id" in data
        assert "compliance_score" in data
        assert "status" in data
        assert "findings" in data
        assert "blocks_audited" in data
        assert "chain_integrity" in data

    async def test_ai_enforce_chain_integrity(self, client, api_prefix, known_barcode):
        resp = await client.post(
            f"{api_prefix}/sathi/ai/enforce",
            params={"barcode": known_barcode},
        )
        assert resp.json()["chain_integrity"] is True

    async def test_ai_enforce_blocks_audited_is_int(self, client, api_prefix, known_barcode):
        resp = await client.post(
            f"{api_prefix}/sathi/ai/enforce",
            params={"barcode": known_barcode},
        )
        assert isinstance(resp.json()["blocks_audited"], int)

    async def test_ai_enforce_404_for_unknown(self, client, api_prefix):
        resp = await client.post(
            f"{api_prefix}/sathi/ai/enforce",
            params={"barcode": "UNKNOWN-99999"},
        )
        assert resp.status_code == 404


class TestMarketplace:
    """GET/POST /api/v1/sathi/marketplace"""

    async def test_marketplace_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/marketplace")
        assert resp.status_code == 200

    async def test_marketplace_has_listings(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/marketplace")
        data = resp.json()
        assert "listings" in data
        assert len(data["listings"]) > 0

    async def test_marketplace_listings_have_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/marketplace")
        for listing in resp.json()["listings"]:
            assert "facility" in listing
            assert "location" in listing
            assert "available_capacity_kg" in listing
            assert "price_per_kg" in listing
            assert "services" in listing
            assert "certification" in listing

    async def test_marketplace_has_stats(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/marketplace")
        data = resp.json()
        assert "total_listings" in data
        assert "total_available_capacity_kg" in data
        assert "average_price_per_kg" in data

    async def test_marketplace_listing_creation(self, client, api_prefix):
        payload = {
            "facility": "Test CBWTF Facility",
            "location": "Test City, India",
            "available_capacity_kg": 500,
            "price_per_kg": 25.0,
            "services": ["incineration", "autoclaving"],
            "certification": "CPCB-Approved",
        }
        resp = await client.post(f"{api_prefix}/sathi/marketplace/list", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "listing" in data

    async def test_marketplace_listing_422_on_missing(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/sathi/marketplace/list", json={})
        assert resp.status_code == 422


class TestCPCBReport:
    """GET /api/v1/sathi/report/generate"""

    async def test_cpcb_report_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/report/generate?facility_id=FAC-001")
        assert resp.status_code == 200

    async def test_cpcb_report_has_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/report/generate?facility_id=FAC-001")
        data = resp.json()
        assert "report_id" in data
        assert "facility" in data
        assert "reporting_period" in data
        assert "generated_at" in data
        assert "generated_by" in data
        assert "submission_status" in data

    async def test_cpcb_report_auto_submitted(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/report/generate?facility_id=FAC-001")
        assert resp.json()["submission_status"] == "auto_submitted"

    async def test_cpcb_report_generated_by_sathi(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/report/generate?facility_id=FAC-001")
        assert "Sāthī" in resp.json()["generated_by"]

    async def test_cpcb_report_has_waste_data(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/report/generate?facility_id=FAC-001")
        wd = resp.json().get("waste_data", {})
        assert "total_generated_kg" in wd
        assert "items_tracked" in wd
        assert "chain_integrity" in wd

    async def test_cpcb_report_has_blockchain_verification(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/report/generate?facility_id=FAC-001")
        bv = resp.json().get("blockchain_verification", {})
        assert "method" in bv
        assert "chains_verified" in bv
        assert "all_chains_intact" in bv

    async def test_cpcb_report_has_digital_signature(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/report/generate?facility_id=FAC-001")
        sig = resp.json().get("digital_signature", "")
        assert sig.startswith("SATHI-VERIFY-")

    async def test_cpcb_report_404_for_unknown_facility(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/sathi/report/generate?facility_id=UNKNOWN-999")
        assert resp.status_code == 404
