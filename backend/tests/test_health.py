from fastapi.testclient import TestClient

from app.config import COST_SECTIONS, SERVICE_NAME, SERVICE_VERSION, SUPPORTED_CURRENCIES


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")

    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == SERVICE_NAME
    assert body["version"] == SERVICE_VERSION
    assert body["capabilities"] == {
        "currencies": list(SUPPORTED_CURRENCIES),
        "categories": list(COST_SECTIONS),
    }
    assert body["timestamp"].endswith("Z")
    assert body["timestamp"].startswith("20")


def test_openapi_document_is_available(client: TestClient) -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/health" in paths
    assert "/api/v1/estimates/calculate" in paths
