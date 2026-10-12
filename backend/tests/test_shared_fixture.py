"""Shared TypeScript/Python golden fixtures.

Consumes ``docs/fixtures/calculation-cases.json`` — the same fixture the
TypeScript suite loads (``src/estimation/shared-fixture.test.ts``), so both
estimation implementations are pinned to a single source of truth. Expected
values in the fixture were derived by hand from the documented rounding rules.
"""

import json
from pathlib import Path
from typing import Any

import pytest

from app.estimation.calculate import calculate_estimate
from app.estimation.money import round_currency
from app.schemas import (
    InfrastructureLine,
    OtherCostLine,
    PersonnelLine,
    ProjectEstimateRequest,
    ToolingLine,
)

FIXTURE_PATH = Path(__file__).resolve().parents[2] / "docs" / "fixtures" / "calculation-cases.json"
FIXTURE: dict[str, Any] = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))

ROUNDING_CASES: list[dict[str, Any]] = FIXTURE["roundingCases"]
ESTIMATE_CASES: list[dict[str, Any]] = FIXTURE["cases"]


def _to_number(value: Any) -> float:
    return float(value)


def _build_request(request: dict[str, Any]) -> ProjectEstimateRequest:
    kwargs: dict[str, Any] = {
        "currency": request["currency"],
        "personnel": [
            PersonnelLine.model_construct(
                role=line["role"],
                people=_to_number(line["people"]),
                hours=_to_number(line["hours"]),
                hourlyRate=_to_number(line["hourlyRate"]),
            )
            for line in request["personnel"]
        ],
        "tooling": [
            ToolingLine.model_construct(name=line["name"], amount=_to_number(line["amount"]))
            for line in request["tooling"]
        ],
        "infrastructure": [
            InfrastructureLine.model_construct(
                name=line["name"],
                monthlyCost=_to_number(line["monthlyCost"]),
                months=_to_number(line["months"]),
            )
            for line in request["infrastructure"]
        ],
        "other": [
            OtherCostLine.model_construct(
                description=line["description"],
                amount=_to_number(line["amount"]),
            )
            for line in request["other"]
        ],
    }
    if "projectName" in request:
        kwargs["projectName"] = request["projectName"]
    return ProjectEstimateRequest.model_construct(**kwargs)


@pytest.mark.parametrize(
    "rounding_case",
    ROUNDING_CASES,
    ids=[str(case["input"]) for case in ROUNDING_CASES],
)
def test_round_currency_matches_fixture(rounding_case: dict[str, Any]) -> None:
    assert round_currency(rounding_case["input"]) == rounding_case["expected"]


def test_fixture_currency_precision() -> None:
    assert FIXTURE["rounding"]["currencyDecimals"] == 2


def test_fixture_covers_both_outcomes() -> None:
    assert any(case["expect"]["ok"] for case in ESTIMATE_CASES)
    assert any(not case["expect"]["ok"] for case in ESTIMATE_CASES)


@pytest.mark.parametrize("test_case", ESTIMATE_CASES, ids=[case["id"] for case in ESTIMATE_CASES])
def test_estimate_matches_fixture(test_case: dict[str, Any]) -> None:
    calculation = calculate_estimate(_build_request(test_case["request"]))
    expected = test_case["expect"]

    assert calculation.ok is expected["ok"]

    if expected["ok"]:
        assert calculation.ok is True
        result = calculation.result
        assert result is not None
        if "currency" in expected:
            assert result.currency == expected["currency"]
        if "projectName" in expected:
            assert result.projectName == expected["projectName"]
        if "lineCount" in expected:
            assert result.lineCount == expected["lineCount"]
        if "personnelCost" in expected:
            assert result.personnelCost == expected["personnelCost"]
        if "toolingCost" in expected:
            assert result.toolingCost == expected["toolingCost"]
        if "infrastructureCost" in expected:
            assert result.infrastructureCost == expected["infrastructureCost"]
        if "otherCost" in expected:
            assert result.otherCost == expected["otherCost"]
        if "total" in expected:
            assert result.total == expected["total"]
    else:
        assert calculation.ok is False
        if "errorCodes" in expected:
            assert [error.code for error in calculation.errors] == expected["errorCodes"]
        if "sections" in expected:
            assert [error.section for error in calculation.errors] == expected["sections"]
        if "lineIndexes" in expected:
            assert [error.lineIndex for error in calculation.errors] == expected["lineIndexes"]
