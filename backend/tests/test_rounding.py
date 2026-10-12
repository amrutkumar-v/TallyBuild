import math

import pytest

from app.estimation.calculate import calculate_estimate
from app.estimation.money import CURRENCY_DECIMALS, round_currency
from app.schemas import (
    InfrastructureLine,
    PersonnelLine,
    ProjectEstimateRequest,
    ToolingLine,
)


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


def test_line_costs_are_rounded_before_summing() -> None:
    calculation = calculate_estimate(
        ProjectEstimateRequest(
            currency="USD",
            tooling=[
                ToolingLine(name="A", amount=0.005),
                ToolingLine(name="B", amount=0.005),
            ],
        )
    )

    assert calculation.ok is True
    assert calculation.result is not None
    assert [line.cost for line in calculation.result.tooling.lines] == [0.01, 0.01]
    assert calculation.result.total == 0.02


def test_sub_paise_line_rounds_to_zero() -> None:
    calculation = calculate_estimate(
        ProjectEstimateRequest(currency="USD", tooling=[ToolingLine(name="A", amount=0.004)])
    )

    assert calculation.ok is True
    assert calculation.result is not None
    assert calculation.result.total == 0


def test_fractional_infrastructure_rounds_to_paise() -> None:
    calculation = calculate_estimate(
        ProjectEstimateRequest(
            currency="USD",
            infrastructure=[InfrastructureLine(name="Cloud", monthlyCost=33.333, months=3)],
        )
    )

    assert calculation.ok is True
    assert calculation.result is not None
    assert calculation.result.infrastructure.lines[0].cost == 100
    assert calculation.result.total == 100


def test_fractional_personnel_rounds_to_paise() -> None:
    calculation = calculate_estimate(
        ProjectEstimateRequest(
            currency="USD",
            personnel=[PersonnelLine(role="Engineer", people=1, hours=1, hourlyRate=0.005)],
        )
    )

    assert calculation.ok is True
    assert calculation.result is not None
    assert calculation.result.personnel.lines[0].cost == 0.01
    assert calculation.result.total == 0.01
