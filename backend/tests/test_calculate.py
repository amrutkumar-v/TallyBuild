import math

import pytest
from fastapi.testclient import TestClient

from app.estimation.calculate import calculate_estimate
from app.schemas import (
    InfrastructureLine,
    OtherCostLine,
    PersonnelLine,
    ProjectEstimateRequest,
    ToolingLine,
)

URL = "/api/v1/estimates/calculate"


def _request(**overrides: object) -> ProjectEstimateRequest:
    data: dict[str, object] = {
        "currency": "USD",
        "personnel": [],
        "tooling": [],
        "infrastructure": [],
        "other": [],
    }
    data.update(overrides)
    return ProjectEstimateRequest.model_validate(data)


def test_documented_personnel_example(client: TestClient) -> None:
    response = client.post(
        URL,
        json={
            "projectName": "Product rebuild",
            "currency": "USD",
            "personnel": [{"role": "Engineer", "people": 2, "hours": 100, "hourlyRate": 50}],
            "tooling": [],
            "infrastructure": [],
            "other": [],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["projectName"] == "Product rebuild"
    assert body["currency"] == "USD"
    assert body["lineCount"] == 1
    assert body["personnel"]["lines"][0]["cost"] == 10000
    assert body["personnelCost"] == 10000
    assert body["total"] == 10000
    assert len(body["assumptions"]) > 0


def test_multi_section_example(client: TestClient) -> None:
    response = client.post(
        URL,
        json={
            "projectName": "Platform build",
            "currency": "EUR",
            "personnel": [{"role": "Lead", "people": 1, "hours": 200, "hourlyRate": 80}],
            "tooling": [{"name": "Design suite", "amount": 1200}],
            "infrastructure": [{"name": "Cloud", "monthlyCost": 900, "months": 6}],
            "other": [{"description": "Licence transfer", "amount": 500}],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["personnelCost"] == 16000
    assert body["toolingCost"] == 1200
    assert body["infrastructureCost"] == 5400
    assert body["otherCost"] == 500
    assert body["total"] == 23100
    assert body["lineCount"] == 4
    assert "projectName" not in body or body["projectName"] == "Platform build"


def test_zero_values_are_valid(client: TestClient) -> None:
    response = client.post(
        URL,
        json={
            "currency": "INR",
            "personnel": [{"role": "Intern", "people": 0, "hours": 0, "hourlyRate": 0}],
            "tooling": [],
            "infrastructure": [],
            "other": [],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["personnelCost"] == 0
    assert body["total"] == 0


def test_empty_request_returns_empty_request(client: TestClient) -> None:
    response = client.post(
        URL,
        json={"currency": "USD", "personnel": [], "tooling": [], "infrastructure": [], "other": []},
    )

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert body["error"]["details"][0]["code"] == "EMPTY_REQUEST"


def test_unsupported_currency_returns_domain_error(client: TestClient) -> None:
    response = client.post(
        URL,
        json={
            "currency": "GBP",
            "personnel": [{"role": "Engineer", "people": 1, "hours": 1, "hourlyRate": 1}],
            "tooling": [],
            "infrastructure": [],
            "other": [],
        },
    )

    assert response.status_code == 422
    detail = response.json()["error"]["details"][0]
    assert detail["code"] == "UNSUPPORTED_CURRENCY"
    assert "section" not in detail


def test_invalid_personnel_reports_every_problem(client: TestClient) -> None:
    response = client.post(
        URL,
        json={
            "currency": "USD",
            "personnel": [{"role": "   ", "people": -1, "hours": 10, "hourlyRate": 20}],
            "tooling": [],
            "infrastructure": [],
            "other": [],
        },
    )

    assert response.status_code == 422
    details = response.json()["error"]["details"]
    assert [detail["code"] for detail in details] == ["INVALID_PERSONNEL", "INVALID_PERSONNEL"]
    assert [detail["section"] for detail in details] == ["personnel", "personnel"]
    assert [detail["lineIndex"] for detail in details] == [0, 0]


def test_invalid_tooling_amount(client: TestClient) -> None:
    response = client.post(
        URL,
        json={
            "currency": "USD",
            "personnel": [],
            "tooling": [{"name": "Suite", "amount": -5}],
            "infrastructure": [],
            "other": [],
        },
    )

    assert response.status_code == 422
    detail = response.json()["error"]["details"][0]
    assert detail["code"] == "INVALID_TOOLING"
    assert detail["section"] == "tooling"
    assert detail["lineIndex"] == 0


def test_invalid_other_cost(client: TestClient) -> None:
    response = client.post(
        URL,
        json={
            "currency": "USD",
            "personnel": [],
            "tooling": [],
            "infrastructure": [],
            "other": [{"description": "", "amount": 100}],
        },
    )

    assert response.status_code == 422
    detail = response.json()["error"]["details"][0]
    assert detail["code"] == "INVALID_OTHER"
    assert detail["section"] == "other"


def test_non_finite_line_is_reported_functionally() -> None:
    for people in (math.nan, math.inf, -math.inf):
        calculation = calculate_estimate(
            _request(
                personnel=[{"role": "Engineer", "people": people, "hours": 1, "hourlyRate": 1}]
            )
        )
        assert calculation.ok is False
        assert any(error.code == "INVALID_PERSONNEL" for error in calculation.errors)


def test_wrong_type_returns_400_malformed(client: TestClient) -> None:
    response = client.post(
        URL,
        json={
            "currency": "USD",
            "personnel": [{"role": "Engineer", "people": "many", "hours": 1, "hourlyRate": 1}],
            "tooling": [],
            "infrastructure": [],
            "other": [],
        },
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "REQUEST_MALFORMED"


def test_invalid_json_returns_400(client: TestClient) -> None:
    response = client.post(
        URL,
        content="{ not valid json",
        headers={"content-type": "application/json"},
    )

    assert response.status_code == 400


@pytest.mark.parametrize("literal", ["Infinity", "-Infinity", "NaN"])
def test_non_finite_values_over_http(client: TestClient, literal: str) -> None:
    body = (
        '{"currency": "USD", "personnel": '
        f'[{{"role": "Engineer", "people": {literal}, "hours": 1, "hourlyRate": 1}}], '
        '"tooling": [], "infrastructure": [], "other": []}'
    )
    response = client.post(URL, content=body, headers={"content-type": "application/json"})

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["code"] == "INVALID_PERSONNEL"


def test_project_name_is_trimmed(client: TestClient) -> None:
    response = client.post(
        URL,
        json={
            "projectName": "  Padded  ",
            "currency": "USD",
            "personnel": [{"role": "Engineer", "people": 1, "hours": 1, "hourlyRate": 10}],
            "tooling": [],
            "infrastructure": [],
            "other": [],
        },
    )

    assert response.status_code == 200
    assert response.json()["projectName"] == "Padded"


def test_missing_arrays_default_to_empty_lists() -> None:
    calculation = calculate_estimate(ProjectEstimateRequest.model_validate({"currency": "USD"}))

    assert calculation.ok is False
    assert calculation.errors[0].code == "EMPTY_REQUEST"


def test_result_sections_expose_lines_and_subtotals() -> None:
    request = ProjectEstimateRequest(
        currency="USD",
        personnel=[PersonnelLine(role="Engineer", people=1, hours=1, hourlyRate=10)],
        tooling=[ToolingLine(name="Suite", amount=100)],
        infrastructure=[InfrastructureLine(name="Cloud", monthlyCost=50, months=2)],
        other=[OtherCostLine(description="Contingency", amount=25)],
    )
    calculation = calculate_estimate(request)

    assert calculation.ok is True
    assert calculation.result is not None
    result = calculation.result
    assert result.personnel.subtotal == 10
    assert result.tooling.subtotal == 100
    assert result.infrastructure.subtotal == 100
    assert result.other.subtotal == 25
    assert result.total == 235
