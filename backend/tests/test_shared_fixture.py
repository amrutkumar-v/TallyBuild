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
from app.estimation.catalogue import SAMPLE_PRODUCT_CATALOGUE, create_catalogue
from app.estimation.money import round_currency
from app.schemas import EstimateLineItem, EstimateRequest, MaterialProduct, PriceSource

FIXTURE_PATH = Path(__file__).resolve().parents[2] / "docs" / "fixtures" / "calculation-cases.json"
FIXTURE: dict[str, Any] = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))

ROUNDING_CASES: list[dict[str, Any]] = FIXTURE["roundingCases"]
ESTIMATE_CASES: list[dict[str, Any]] = FIXTURE["cases"]
CUSTOM_CATALOGUE: list[dict[str, Any]] = FIXTURE["customCatalogue"]


def _to_number(value: Any) -> float:
    return float(value)


def _build_product(spec: dict[str, Any]) -> MaterialProduct:
    source = spec.get("priceSource")
    return MaterialProduct.model_construct(
        id=spec["id"],
        name=spec["name"],
        category=spec["category"],
        unit=spec["unit"],
        unitPrice=_to_number(spec["unitPrice"]),
        priceSource=None if source is None else PriceSource(**source),
    )


def _build_line(line: dict[str, Any]) -> EstimateLineItem:
    data: dict[str, Any] = {
        "productId": line["productId"],
        "quantity": _to_number(line["quantity"]),
    }
    if "unit" in line:
        data["unit"] = line["unit"]
    if "label" in line:
        data["label"] = line["label"]
    return EstimateLineItem.model_construct(**data)


def _build_request(test_case: dict[str, Any]) -> EstimateRequest:
    request = test_case["request"]
    return EstimateRequest(
        projectName=request.get("projectName"),
        lines=[_build_line(line) for line in request["lines"]],
    )


def _catalogue_for(kind: str) -> Any:
    if kind == "sample":
        return SAMPLE_PRODUCT_CATALOGUE
    return create_catalogue([_build_product(product) for product in CUSTOM_CATALOGUE])


@pytest.mark.parametrize(
    "rounding_case",
    ROUNDING_CASES,
    ids=[str(case["input"]) for case in ROUNDING_CASES],
)
def test_round_currency_matches_fixture(rounding_case: dict[str, Any]) -> None:
    assert round_currency(rounding_case["input"]) == rounding_case["expected"]


def test_fixture_currency_precision() -> None:
    assert FIXTURE["rounding"]["currencyDecimals"] == 2


@pytest.mark.parametrize("test_case", ESTIMATE_CASES, ids=[case["id"] for case in ESTIMATE_CASES])
def test_estimate_matches_fixture(test_case: dict[str, Any]) -> None:
    calculation = calculate_estimate(
        _build_request(test_case),
        _catalogue_for(test_case["catalogue"]),
    )
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
        if "itemCount" in expected:
            assert result.itemCount == expected["itemCount"]
        if "lineSubtotals" in expected:
            assert [line.lineSubtotal for line in result.lineResults] == expected["lineSubtotals"]
        if "subtotal" in expected:
            assert result.subtotal == expected["subtotal"]
        if "total" in expected:
            assert result.total == expected["total"]
    else:
        assert calculation.ok is False
        if "errorCodes" in expected:
            assert [error.code for error in calculation.errors] == expected["errorCodes"]
        if "lineIndexes" in expected:
            assert [error.lineIndex for error in calculation.errors] == expected["lineIndexes"]
        if "productIds" in expected:
            assert [error.productId for error in calculation.errors] == expected["productIds"]
