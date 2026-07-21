"""Tests for Boon AI classification API endpoints."""

import pytest


class TestClassifyWaste:
    """POST /api/v1/classify/"""

    @pytest.mark.parametrize("waste_type,expected_category", [
        ("hypodermic_needles", "white"),
        ("iv_tubing", "red"),
        ("blood_bags", "yellow"),
        ("glass_vials", "blue"),
        ("gloves", "red"),
        ("scalpels", "white"),
        ("human_anatomical_waste", "yellow"),
        ("metallic_implants", "blue"),
    ])
    async def test_classify_known_types(self, client, api_prefix, waste_type, expected_category):
        resp = await client.post(
            f"{api_prefix}/classify/",
            json={"waste_type": waste_type},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["predicted_category"] == expected_category
        assert data["waste_type"] == waste_type

    async def test_classify_returns_200(self, client, api_prefix):
        resp = await client.post(
            f"{api_prefix}/classify/",
            json={"waste_type": "hypodermic_needles"},
        )
        assert resp.status_code == 200

    async def test_classify_has_required_fields(self, client, api_prefix):
        resp = await client.post(
            f"{api_prefix}/classify/",
            json={"waste_type": "hypodermic_needles"},
        )
        data = resp.json()
        assert "predicted_category" in data
        assert "confidence" in data
        assert "waste_type" in data
        assert "treatment_recommendation" in data
        assert "disposal_guidelines" in data
        assert "processing_time_ms" in data

    async def test_classify_confidence_between_0_and_1(self, client, api_prefix):
        resp = await client.post(
            f"{api_prefix}/classify/",
            json={"waste_type": "hypodermic_needles"},
        )
        conf = resp.json()["confidence"]
        assert 0 < conf <= 1.0

    async def test_classify_disposal_guidelines_is_list(self, client, api_prefix):
        resp = await client.post(
            f"{api_prefix}/classify/",
            json={"waste_type": "hypodermic_needles"},
        )
        assert isinstance(resp.json()["disposal_guidelines"], list)
        assert len(resp.json()["disposal_guidelines"]) > 0

    async def test_classify_processing_time_positive(self, client, api_prefix):
        resp = await client.post(
            f"{api_prefix}/classify/",
            json={"waste_type": "hypodermic_needles"},
        )
        assert resp.json()["processing_time_ms"] > 0

    async def test_classify_unknown_type_uses_fuzzy_match(self, client, api_prefix):
        """Unknown waste type should fuzzy-match to the closest category."""
        resp = await client.post(
            f"{api_prefix}/classify/",
            json={"waste_type": "surgical_needle"},
        )
        assert resp.status_code == 200
        assert resp.json()["predicted_category"] in ("white", "yellow", "red", "blue")
        # surgical needle should fuzzy-match to white (sharps)
        assert resp.json()["predicted_category"] == "white"

    async def test_classify_with_image_b64(self, client, api_prefix):
        resp = await client.post(
            f"{api_prefix}/classify/",
            json={"waste_type": "gloves", "image_b64": "dGVzdF9pbWFnZV9kYXRh"},
        )
        assert resp.status_code == 200
        assert resp.json()["predicted_category"] == "red"

    async def test_classify_confidence_higher_for_exact_match(self, client, api_prefix):
        """Exact matches should have confidence > 0.85."""
        resp = await client.post(
            f"{api_prefix}/classify/",
            json={"waste_type": "blood_bags"},
        )
        assert resp.json()["confidence"] > 0.85


class TestClassifyBatch:
    """POST /api/v1/classify/batch"""

    async def test_batch_returns_200(self, client, api_prefix):
        resp = await client.post(
            f"{api_prefix}/classify/batch",
            json={
                "items": [
                    {"waste_type": "hypodermic_needles"},
                    {"waste_type": "gloves"},
                    {"waste_type": "glass_vials"},
                ]
            },
        )
        assert resp.status_code == 200

    async def test_batch_returns_results_key(self, client, api_prefix):
        resp = await client.post(
            f"{api_prefix}/classify/batch",
            json={
                "items": [
                    {"waste_type": "hypodermic_needles"},
                    {"waste_type": "gloves"},
                ]
            },
        )
        assert "results" in resp.json()

    async def test_batch_returns_correct_count(self, client, api_prefix):
        resp = await client.post(
            f"{api_prefix}/classify/batch",
            json={
                "items": [
                    {"waste_type": "hypodermic_needles"},
                    {"waste_type": "gloves"},
                    {"waste_type": "glass_vials"},
                ]
            },
        )
        assert len(resp.json()["results"]) == 3

    async def test_batch_each_result_has_prediction(self, client, api_prefix):
        resp = await client.post(
            f"{api_prefix}/classify/batch",
            json={
                "items": [
                    {"waste_type": "hypodermic_needles"},
                    {"waste_type": "gloves"},
                ]
            },
        )
        for r in resp.json()["results"]:
            assert "predicted_category" in r
            assert "confidence" in r

    async def test_batch_empty_list(self, client, api_prefix):
        resp = await client.post(
            f"{api_prefix}/classify/batch",
            json={"items": []},
        )
        assert resp.status_code == 200
        assert resp.json()["results"] == []


class TestClassifyCategories:
    """GET /api/v1/classify/categories"""

    async def test_classify_categories_returns_200(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/classify/categories")
        assert resp.status_code == 200

    async def test_classify_categories_has_categories_key(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/classify/categories")
        assert "categories" in resp.json()

    async def test_classify_categories_count(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/classify/categories")
        assert len(resp.json()["categories"]) == 4

    async def test_classify_categories_have_treatment_info(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/classify/categories")
        for cat in resp.json()["categories"]:
            assert "category" in cat
            assert "name" in cat
            assert "treatment" in cat
            assert "container" in cat


class TestTreatmentGuide:
    """GET /api/v1/classify/guide/{category}"""

    @pytest.mark.parametrize("category", ["yellow", "red", "white", "blue"])
    async def test_guide_returns_200(self, client, api_prefix, category):
        resp = await client.get(f"{api_prefix}/classify/guide/{category}")
        assert resp.status_code == 200

    @pytest.mark.parametrize("category", ["yellow", "red", "white", "blue"])
    async def test_guide_has_required_fields(self, client, api_prefix, category):
        resp = await client.get(f"{api_prefix}/classify/guide/{category}")
        data = resp.json()
        assert data["category"] == category
        assert "treatment" in data
        assert isinstance(data["treatment"], str)
        assert len(data["treatment"]) > 0
        assert "guidelines" in data
        assert isinstance(data["guidelines"], list)
        assert len(data["guidelines"]) > 0

    async def test_guide_404_for_invalid_category(self, client, api_prefix):
        resp = await client.get(f"{api_prefix}/classify/guide/purple")
        assert resp.status_code == 404

    @pytest.mark.parametrize("category,expected_treatment_keyword", [
        ("yellow", "Incineration"),
        ("red", "Autoclaving"),
        ("white", "Autoclaving"),
        ("blue", "Chemical"),
    ])
    async def test_guide_treatment_contains_keyword(self, client, api_prefix, category, expected_treatment_keyword):
        resp = await client.get(f"{api_prefix}/classify/guide/{category}")
        assert expected_treatment_keyword in resp.json()["treatment"]
