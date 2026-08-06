"""
tests/test_api_complaint.py

End-to-end tests through the FastAPI TestClient, with the Gemini
client swapped out via `app.dependency_overrides` for a
FakeGeminiClient returning canned responses. This exercises the full
request -> orchestrator -> services -> knowledge -> response path
without making a real network call.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_gemini_client
from app.main import create_app
from app.tests.conftest import FakeGeminiClient


@pytest.fixture
def client() -> TestClient:
    app = create_app()
    fake_client = FakeGeminiClient(
        '{"category_code": "ROAD_DAMAGE", "confidence": 0.87, '
        '"entities": {"location": "MG Road", "landmark": null, '
        '"issue_type": "pothole", "dates_mentioned": []}, "llm_signals": []}'
    )
    app.dependency_overrides[get_gemini_client] = lambda: fake_client
    return TestClient(app)


def test_health_check(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_classify_complaint_end_to_end(client: TestClient) -> None:
    response = client.post(
        "/api/v1/complaints/classify",
        json={"text": "There is a big pothole on MG Road near the market.", "language": "en"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["category_code"] == "ROAD_DAMAGE"
    assert body["department_code"] == "PWD"
    assert body["entities"]["location"] == "MG Road"
    assert body["confidence"] == pytest.approx(0.87)


def test_validate_form_no_llm_call_needed(client: TestClient) -> None:
    response = client.post(
        "/api/v1/complaints/validate-form",
        json={
            "category_code": "ROAD_DAMAGE",
            "department_code": "PWD",
            "description": "Pothole near market.",
            "attached_document_types": ["PHOTO_EVIDENCE"],
        },
    )
    assert response.status_code == 200
    assert response.json()["is_valid"] is True


def test_classify_with_invalid_json_returns_502(client: TestClient) -> None:
    app = client.app
    app.dependency_overrides[get_gemini_client] = lambda: FakeGeminiClient(
        ["not json", "still not json", "still not json"]
    )
    response = client.post(
        "/api/v1/complaints/classify",
        json={"text": "Something is wrong.", "language": "en"},
    )
    assert response.status_code == 502
    assert response.json()["error_code"] == "LLM_INVALID_JSON"
