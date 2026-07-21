"""Tests for Boon Scanner & QR Code Management API endpoints."""

import pytest


class TestGenerateQR:
    """POST /api/v1/scanner/generate-qr"""

    QR_PAYLOAD = {
        "waste_type": "human_anatomical_waste",
        "category": "yellow",
        "source_facility": "AIIMS New Delhi",
        "department": "Emergency",
        "weight_kg": 2.5,
        "container_type": "bag",
        "handler_name": "Test Operator",
    }

    async def test_generate_qr_returns_200(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/generate-qr", json=self.QR_PAYLOAD)
        assert resp.status_code == 200

    async def test_generate_qr_has_required_fields(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/generate-qr", json=self.QR_PAYLOAD)
        data = resp.json()
        assert data["success"] is True
        assert "barcode" in data
        assert "qr_data_url" in data
        assert "qr_payload" in data
        assert "metadata" in data
        assert "print_info" in data

    async def test_generate_qr_barcode_format(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/generate-qr", json=self.QR_PAYLOAD)
        barcode = resp.json()["barcode"]
        # Format: BOON-XXXX-XX-XXXXXX-XXXXX
        parts = barcode.split("-")
        assert len(parts) == 5
        assert parts[0] == "BOON"
        assert len(parts[1]) == 4  # Facility hash
        assert len(parts[2]) == 2  # Category code
        assert len(parts[3]) == 6  # Date (YYMMDD)
        assert len(parts[4]) == 5  # Sequential ID

    async def test_generate_qr_unique_barcodes(self, client, api_prefix):
        """Two sequential calls should produce different barcodes."""
        r1 = await client.post(f"{api_prefix}/scanner/generate-qr", json=self.QR_PAYLOAD)
        r2 = await client.post(f"{api_prefix}/scanner/generate-qr", json=self.QR_PAYLOAD)
        b1 = r1.json()["barcode"]
        b2 = r2.json()["barcode"]
        assert b1 != b2

    async def test_generate_qr_collision_resistant(self, client, api_prefix):
        """AIIMS New Delhi and AIIMS Bangalore should get different facility hashes."""
        payload1 = {**self.QR_PAYLOAD, "source_facility": "AIIMS New Delhi"}
        payload2 = {**self.QR_PAYLOAD, "source_facility": "AIIMS Bangalore"}
        r1 = await client.post(f"{api_prefix}/scanner/generate-qr", json=payload1)
        r2 = await client.post(f"{api_prefix}/scanner/generate-qr", json=payload2)
        hash1 = r1.json()["barcode"].split("-")[1]
        hash2 = r2.json()["barcode"].split("-")[1]
        assert hash1 != hash2, "Facility hash collision detected!"

    async def test_generate_qr_data_url_is_base64_png(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/generate-qr", json=self.QR_PAYLOAD)
        url = resp.json()["qr_data_url"]
        assert url.startswith("data:image/png;base64,")
        assert len(url) > 100  # Should be a substantial base64 string

    async def test_generate_qr_metadata_matches_input(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/generate-qr", json=self.QR_PAYLOAD)
        meta = resp.json()["metadata"]
        assert meta["waste_type"] == self.QR_PAYLOAD["waste_type"]
        assert meta["category"] == self.QR_PAYLOAD["category"]
        assert meta["source"] == self.QR_PAYLOAD["source_facility"]
        assert meta["weight_kg"] == self.QR_PAYLOAD["weight_kg"]

    async def test_generate_qr_blockchain_registered(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/generate-qr", json=self.QR_PAYLOAD)
        assert resp.json().get("blockchain_registered") is True

    async def test_generate_qr_has_sathi_trace_url(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/generate-qr", json=self.QR_PAYLOAD)
        trace_url = resp.json().get("sathi_trace_url", "")
        assert "/sathi?barcode=" in trace_url

    async def test_generate_qr_print_info_present(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/generate-qr", json=self.QR_PAYLOAD)
        pi = resp.json()["print_info"]
        assert "label_size" in pi
        assert "recommended_position" in pi
        assert "durable_material" in pi

    async def test_generate_qr_422_on_missing_fields(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/generate-qr", json={})
        assert resp.status_code == 422

    async def test_generate_qr_422_on_wrong_types(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/generate-qr", json={
            "waste_type": 123,
            "category": True,
            "source_facility": None,
        })
        assert resp.status_code == 422


class TestVerifyBarcode:
    """GET /api/v1/scanner/verify/{barcode}"""

    async def test_verify_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/verify/SOME-BARCODE")
        assert resp.status_code == 200

    async def test_verify_not_found_returns_false(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/verify/UNKNOWN-12345")
        data = resp.json()
        assert data["verified"] is False
        assert data["source"] is None

    async def test_verify_not_found_has_message(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/verify/UNKNOWN-12345")
        data = resp.json()
        assert "message" in data
        assert "suggestion" in data

    async def test_verify_has_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/verify/UNKNOWN-12345")
        data = resp.json()
        assert "verified" in data

    async def test_verify_known_barcode_from_sample(self, client, api_prefix, known_barcode):
        resp = await client.get(f"{api_prefix}/scanner/verify/{known_barcode}")
        data = resp.json()
        assert data["verified"] is True
        assert data["source"] == "main_system"
        assert "facility" in data  # Facility name from sample data
        assert "barcode" in data
        assert "status" in data
        assert "category" in data
        assert "weight_kg" in data

    async def test_verify_known_barcode_trace_url(self, client, api_prefix, known_barcode):
        resp = await client.get(f"{api_prefix}/scanner/verify/{known_barcode}")
        data = resp.json()
        assert "/tracking/trace/" in data.get("trace_url", "")

    async def test_verify_fuzzy_search(self, client, api_prefix):
        """Partial barcode should match via fuzzy search on main system."""
        resp = await client.get(f"{api_prefix}/scanner/verify/BOON-001")
        data = resp.json()
        assert data["verified"] is True


class TestLogScan:
    """POST /api/v1/scanner/log-scan"""

    SCAN_PAYLOAD = {
        "barcode": "BOON-TEST-12345",
        "waste_type": "soiled_dressing",
        "category": "yellow",
        "weight_kg": 1.5,
        "source_facility": "AIIMS New Delhi",
        "department": "ICU",
        "container_type": "bag",
        "scanned_by": "Test User",
        "notes": "Test scan entry",
    }

    async def test_log_scan_returns_200(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/log-scan", json=self.SCAN_PAYLOAD)
        assert resp.status_code == 200

    async def test_log_scan_success(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/log-scan", json=self.SCAN_PAYLOAD)
        data = resp.json()
        assert data["success"] is True
        assert data["message"] is not None

    async def test_log_scan_has_scan_entry(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/log-scan", json=self.SCAN_PAYLOAD)
        data = resp.json()
        assert "scan_entry" in data
        entry = data["scan_entry"]
        assert entry["barcode"] == self.SCAN_PAYLOAD["barcode"]
        assert entry["status"] == "logged"
        assert entry["synced_to_main"] is True

    async def test_log_scan_has_tracking_url(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/log-scan", json=self.SCAN_PAYLOAD)
        data = resp.json()
        assert "/tracking/trace/" in data.get("tracking_url", "")

    async def test_log_scan_422_on_missing_fields(self, client, api_prefix):
        resp = await client.post(f"{api_prefix}/scanner/log-scan", json={})
        assert resp.status_code == 422


class TestScanHistory:
    """GET /api/v1/scanner/history"""

    async def test_history_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/history")
        assert resp.status_code == 200

    async def test_history_has_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/history")
        data = resp.json()
        assert "total" in data
        assert "items" in data
        assert "limit" in data
        assert "offset" in data

    async def test_history_items_is_list(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/history")
        assert isinstance(resp.json()["items"], list)

    async def test_history_respects_limit(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/history?limit=5")
        data = resp.json()
        assert data["limit"] == 5
        assert len(data["items"]) <= 5

    async def test_history_respects_offset(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/history?offset=10&limit=5")
        data = resp.json()
        assert data["offset"] == 10

    async def test_history_after_logging_scan(self, client, api_prefix):
        """After logging a scan, history should reflect it."""
        scan = {
            "barcode": "HISTORY-TEST-001",
            "waste_type": "gloves",
            "category": "red",
            "weight_kg": 0.5,
            "source_facility": "Fortis Hospital",
            "department": "General Ward",
            "container_type": "bin",
            "scanned_by": "History Tester",
        }
        await client.post(f"{api_prefix}/scanner/log-scan", json=scan)
        resp = await client.get(f"{api_prefix}/scanner/history")
        items = resp.json()["items"]
        barcodes = [i["barcode"] for i in items]
        assert "HISTORY-TEST-001" in barcodes


class TestScannerStats:
    """GET /api/v1/scanner/stats"""

    async def test_stats_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/stats")
        assert resp.status_code == 200

    async def test_stats_has_required_fields(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/stats")
        data = resp.json()
        assert "total_scans" in data
        assert "today_scans" in data
        assert "unique_barcodes" in data
        assert "category_breakdown" in data
        assert "total_weight_kg" in data
        assert "system_status" in data

    async def test_stats_system_connected(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/stats")
        assert resp.json()["system_status"] == "connected"

    async def test_stats_total_scans_is_int(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/stats")
        assert isinstance(resp.json()["total_scans"], int)

    async def test_stats_unique_barcodes_is_int(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/stats")
        assert isinstance(resp.json()["unique_barcodes"], int)

    async def test_stats_category_breakdown_is_dict(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/stats")
        assert isinstance(resp.json()["category_breakdown"], dict)


class TestScannerRealData:
    """GET /api/v1/scanner/real-data/*"""

    async def test_real_data_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/real-data")
        assert resp.status_code == 200

    async def test_state_wise_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/real-data/state-wise")
        assert resp.status_code == 200

    async def test_hospitals_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/real-data/hospitals")
        assert resp.status_code == 200

    async def test_hospitals_has_hospitals_list(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/real-data/hospitals")
        data = resp.json()
        assert "hospitals" in data
        assert len(data["hospitals"]) > 0

    async def test_categories_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/real-data/categories")
        assert resp.status_code == 200

    async def test_segregation_guide_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/scanner/real-data/segregation-guide")
        assert resp.status_code == 200
