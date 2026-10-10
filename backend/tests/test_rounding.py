import math

import pytest

from app.estimation.calculate import calculate_estimate
from app.estimation.catalogue import create_catalogue
from app.estimation.money import CURRENCY_DECIMALS, round_currency
from app.schemas import EstimateLineItem, EstimateRequest
from tests.factories import make_product


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (1.005, 1.01),
        (2.675, 2.68),
        (0.005, 0.01),
        (10.124, 10.12),
        (1.111, 1.11),
        (100, 100),
        (4100, 4100),
        (0, 0),
    ],
)
def test_round_currency_matches_typescript(value: float, expected: float) -> None:
    assert round_currency(value) == expected


def test_currency_decimals_constant() -> None:
    assert CURRENCY_DECIMALS == 2


@pytest.mark.parametrize("value", [math.inf, -math.inf, math.nan])
def test_round_currency_returns_non_finite_unchanged(value: float) -> None:
    result = round_currency(value)
    assert not math.isfinite(result)


def test_line_subtotals_are_rounded_before_summing() -> None:
    catalogue = create_catalogue(
        [
            make_product(id="half-paise", unitPrice=0.005),
            make_product(id="small-paise", unitPrice=0.004),
        ]
    )

    calculation = calculate_estimate(
        EstimateRequest(
            lines=[
                EstimateLineItem(productId="half-paise", quantity=1),
                EstimateLineItem(productId="half-paise", quantity=1),
            ]
        ),
        catalogue,
    )

    assert calculation.ok is True
    assert calculation.result is not None
    assert [line.lineSubtotal for line in calculation.result.lineResults] == [0.01, 0.01]
    assert calculation.result.total == 0.02

    single = calculate_estimate(
        EstimateRequest(lines=[EstimateLineItem(productId="small-paise", quantity=1)]),
        catalogue,
    )
    assert single.ok is True
    assert single.result is not None
    assert single.result.total == 0


def test_fractional_quantity_rounds_to_paise() -> None:
    catalogue = create_catalogue([make_product(id="metre", unit="m", unitPrice=33.333)])

    calculation = calculate_estimate(
        EstimateRequest(lines=[EstimateLineItem(productId="metre", quantity=3)]),
        catalogue,
    )

    assert calculation.ok is True
    assert calculation.result is not None
    assert calculation.result.lineResults[0].lineSubtotal == 100
    assert calculation.result.total == 100


@pytest.mark.parametrize("unit_price", [0, -5, math.inf])
def test_invalid_unit_price_is_reported(unit_price: float) -> None:
    catalogue = create_catalogue([make_product(id="bad-price", unitPrice=unit_price)])

    calculation = calculate_estimate(
        EstimateRequest(lines=[EstimateLineItem(productId="bad-price", quantity=1)]),
        catalogue,
    )

    assert calculation.ok is False
    assert any(error.code == "INVALID_PRICE" for error in calculation.errors)


def test_missing_price_source_is_reported() -> None:
    catalogue = create_catalogue([make_product(id="no-source", priceSource=None)])

    calculation = calculate_estimate(
        EstimateRequest(lines=[EstimateLineItem(productId="no-source", quantity=1)]),
        catalogue,
    )

    assert calculation.ok is False
    assert calculation.errors[0].code == "INVALID_PRICE_SOURCE"
