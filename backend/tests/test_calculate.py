import math

import pytest
from fastapi.testclient import TestClient

from app.estimation.calculate import calculate_estimate
from app.schemas import EstimateLineItem, EstimateRequest

URL = "/api/v1/estimates/calculate"


def _request(lines: list[EstimateLineItem], project_name: str | None = None) -> EstimateRequest:
    return EstimateRequest(projectName=project_name, lines=lines)


def test_documented_multi_line_example(client: TestClient) -> None:
    response = client.post(
        URL,
        json={
            "projectName": "Demo villa",
            "lines": [
                {
                    "productId": "cement-opc-53-grade",
                    "quantity": 320,
                    "unit": "bag",
                    "label": "Foundation",
                },
                {
                    "productId": "steel-tmt-fe500",
                    "quantity": 4.5,
                    "unit": "tonne",
                    "label": "Reinforcement",
                },
                {"productId": "brick-red-clay", "quantity": 12000, "unit": "piece"},
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["projectName"] == "Demo villa"
    assert body["currency"] == "INR"
    assert body["itemCount"] == 3
    assert [line["lineSubtotal"] for line in body["lineResults"]] == [131200, 306000, 108000]
    assert body["subtotal"] == 545200
    assert body["total"] == 545200
    assert len(body["priceSources"]) == 1
    assert "label" not in body["lineResults"][2]


def test_single_line_subtotal(client: TestClient) -> None:
    response = client.post(
        URL,
        json={"lines": [{"productId": "cement-opc-53-grade", "quantity": 10}]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["lineResults"][0]["lineSubtotal"] == 4100
    assert body["total"] == 4100
    assert "projectName" not in body


def test_zero_quantity_is_a_valid_line(client: TestClient) -> None:
    response = client.post(URL, json={"lines": [{"productId": "brick-red-clay", "quantity": 0}]})

    assert response.status_code == 200
    body = response.json()
    assert body["lineResults"][0]["lineSubtotal"] == 0
    assert body["total"] == 0


def test_negative_quantity_returns_422_with_detail(client: TestClient) -> None:
    response = client.post(URL, json={"lines": [{"productId": "brick-red-clay", "quantity": -5}]})

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    detail = body["error"]["details"][0]
    assert detail["code"] == "INVALID_QUANTITY"
    assert detail["lineIndex"] == 0
    assert detail["productId"] == "brick-red-clay"


def test_unknown_product_returns_422(client: TestClient) -> None:
    response = client.post(URL, json={"lines": [{"productId": "does-not-exist", "quantity": 1}]})

    assert response.status_code == 422
    detail = response.json()["error"]["details"][0]
    assert detail["code"] == "MISSING_PRODUCT"
    assert detail["productId"] == "does-not-exist"


def test_incompatible_unit_returns_422(client: TestClient) -> None:
    response = client.post(
        URL,
        json={"lines": [{"productId": "cement-opc-53-grade", "quantity": 1, "unit": "kg"}]},
    )

    assert response.status_code == 422
    detail = response.json()["error"]["details"][0]
    assert detail["code"] == "INCOMPATIBLE_UNIT"


def test_same_family_unit_returns_conversion_unsupported(client: TestClient) -> None:
    response = client.post(
        URL,
        json={"lines": [{"productId": "steel-tmt-fe500", "quantity": 1, "unit": "kg"}]},
    )

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["code"] == "UNIT_CONVERSION_UNSUPPORTED"


def test_unsupported_unit_is_domain_validation_not_malformed(client: TestClient) -> None:
    response = client.post(
        URL,
        json={"lines": [{"productId": "cement-opc-53-grade", "quantity": 1, "unit": "litre"}]},
    )

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert body["error"]["details"][0]["code"] == "INVALID_UNIT"


def test_empty_lines_returns_empty_request(client: TestClient) -> None:
    response = client.post(URL, json={"lines": []})

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert body["error"]["details"][0]["code"] == "EMPTY_REQUEST"


def test_multiple_failing_lines_are_all_reported(client: TestClient) -> None:
    response = client.post(
        URL,
        json={
            "lines": [
                {"productId": "does-not-exist", "quantity": 1},
                {"productId": "cement-opc-53-grade", "quantity": -3},
            ]
        },
    )

    assert response.status_code == 422
    details = response.json()["error"]["details"]
    assert len(details) == 2
    assert details[0]["code"] == "MISSING_PRODUCT"
    assert details[1]["code"] == "INVALID_QUANTITY"


def test_non_finite_quantity_is_rejected_functionally() -> None:
    for quantity in (math.nan, math.inf, -math.inf):
        calculation = calculate_estimate(
            _request([EstimateLineItem(productId="brick-red-clay", quantity=quantity)])
        )
        assert calculation.ok is False
        assert any(error.code == "INVALID_QUANTITY" for error in calculation.errors)


def test_missing_lines_key_returns_400_malformed(client: TestClient) -> None:
    response = client.post(URL, json={"projectName": "No lines"})

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "REQUEST_MALFORMED"


def test_invalid_json_returns_400(client: TestClient) -> None:
    response = client.post(
        URL,
        content="{ not valid json",
        headers={"content-type": "application/json"},
    )

    assert response.status_code == 400


def test_wrong_type_quantity_returns_400(client: TestClient) -> None:
    response = client.post(
        URL,
        json={"lines": [{"productId": "brick-red-clay", "quantity": "many"}]},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "REQUEST_MALFORMED"


@pytest.mark.parametrize("literal", ["Infinity", "-Infinity", "NaN"])
def test_non_finite_quantity_over_http(client: TestClient, literal: str) -> None:
    body = f'{{"lines": [{{"productId": "brick-red-clay", "quantity": {literal}}}]}}'
    response = client.post(URL, content=body, headers={"content-type": "application/json"})

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["code"] == "INVALID_QUANTITY"
