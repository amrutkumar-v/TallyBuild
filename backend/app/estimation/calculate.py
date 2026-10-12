"""Deterministic estimate calculation.

Mirrors ``src/estimation/calculate.ts`` exactly: same validation order, same
error codes and messages, same rounding. The backend must not introduce new
calculation rules.
"""

import math
from dataclasses import dataclass, field

from ..config import SUPPORTED_CURRENCIES
from ..schemas import (
    EstimateValidationError,
    InfrastructureResult,
    InfrastructureSection,
    OtherCostResult,
    OtherCostSection,
    PersonnelLine,
    PersonnelResult,
    PersonnelSection,
    ProjectEstimateRequest,
    ProjectEstimateResult,
    ToolingResult,
    ToolingSection,
)
from .money import round_currency


@dataclass(frozen=True)
class EstimateCalculation:
    ok: bool
    result: ProjectEstimateResult | None = None
    errors: tuple[EstimateValidationError, ...] = field(default_factory=tuple)


def _is_finite_non_negative(value: object) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
        and value >= 0
    )


def _is_non_empty_text(value: object) -> bool:
    return isinstance(value, str) and value.strip() != ""


def _currency_supported(currency: object) -> bool:
    return isinstance(currency, str) and currency in SUPPORTED_CURRENCIES


def build_assumptions(currency: str) -> list[str]:
    return [
        (
            f"All amounts are calculated in {currency}. Live currency conversion is not "
            "configured, so each estimate stays in the currency you choose."
        ),
        "Personnel cost = people × hours × hourly rate per team line.",
        "Infrastructure cost = monthly cost × months per resource line.",
        'Excludes taxes, duties and contingency unless you add them as an "other" cost line.',
    ]


def validate_estimate_request(
    request: ProjectEstimateRequest,
) -> list[EstimateValidationError]:
    errors: list[EstimateValidationError] = []

    if not _currency_supported(request.currency):
        errors.append(
            EstimateValidationError(
                code="UNSUPPORTED_CURRENCY",
                message=(
                    f'Currency "{request.currency}" is not supported. '
                    f"Choose one of {', '.join(SUPPORTED_CURRENCIES)}."
                ),
            )
        )

    personnel = request.personnel if isinstance(request.personnel, list) else []
    tooling = request.tooling if isinstance(request.tooling, list) else []
    infrastructure = request.infrastructure if isinstance(request.infrastructure, list) else []
    other = request.other if isinstance(request.other, list) else []

    if not personnel and not tooling and not infrastructure and not other:
        errors.append(
            EstimateValidationError(
                code="EMPTY_REQUEST",
                message=(
                    "Add at least one cost line (personnel, tooling, infrastructure or "
                    "other) to calculate an estimate."
                ),
            )
        )
        return errors

    for index, line in enumerate(personnel):
        line_number = index + 1
        if not _is_non_empty_text(line.role):
            errors.append(
                EstimateValidationError(
                    code="INVALID_PERSONNEL",
                    message=f"Personnel line {line_number}: role is required.",
                    section="personnel",
                    lineIndex=index,
                )
            )
        if not _is_finite_non_negative(line.people):
            errors.append(
                EstimateValidationError(
                    code="INVALID_PERSONNEL",
                    message=(
                        f"Personnel line {line_number}: number of people must be a finite "
                        "number that is 0 or more."
                    ),
                    section="personnel",
                    lineIndex=index,
                )
            )
        if not _is_finite_non_negative(line.hours):
            errors.append(
                EstimateValidationError(
                    code="INVALID_PERSONNEL",
                    message=(
                        f"Personnel line {line_number}: hours must be a finite number that "
                        "is 0 or more."
                    ),
                    section="personnel",
                    lineIndex=index,
                )
            )
        if not _is_finite_non_negative(line.hourlyRate):
            errors.append(
                EstimateValidationError(
                    code="INVALID_PERSONNEL",
                    message=(
                        f"Personnel line {line_number}: hourly rate must be a finite "
                        "number that is 0 or more."
                    ),
                    section="personnel",
                    lineIndex=index,
                )
            )

    for index, line in enumerate(tooling):
        line_number = index + 1
        if not _is_non_empty_text(line.name):
            errors.append(
                EstimateValidationError(
                    code="INVALID_TOOLING",
                    message=f"Tooling line {line_number}: name is required.",
                    section="tooling",
                    lineIndex=index,
                )
            )
        if not _is_finite_non_negative(line.amount):
            errors.append(
                EstimateValidationError(
                    code="INVALID_TOOLING",
                    message=(
                        f"Tooling line {line_number}: cost must be a finite number that is "
                        "0 or more."
                    ),
                    section="tooling",
                    lineIndex=index,
                )
            )

    for index, line in enumerate(infrastructure):
        line_number = index + 1
        if not _is_non_empty_text(line.name):
            errors.append(
                EstimateValidationError(
                    code="INVALID_INFRASTRUCTURE",
                    message=f"Infrastructure line {line_number}: name is required.",
                    section="infrastructure",
                    lineIndex=index,
                )
            )
        if not _is_finite_non_negative(line.monthlyCost):
            errors.append(
                EstimateValidationError(
                    code="INVALID_INFRASTRUCTURE",
                    message=(
                        f"Infrastructure line {line_number}: monthly cost must be a finite "
                        "number that is 0 or more."
                    ),
                    section="infrastructure",
                    lineIndex=index,
                )
            )
        if not _is_finite_non_negative(line.months):
            errors.append(
                EstimateValidationError(
                    code="INVALID_INFRASTRUCTURE",
                    message=(
                        f"Infrastructure line {line_number}: months must be a finite number "
                        "that is 0 or more."
                    ),
                    section="infrastructure",
                    lineIndex=index,
                )
            )

    for index, line in enumerate(other):
        line_number = index + 1
        if not _is_non_empty_text(line.description):
            errors.append(
                EstimateValidationError(
                    code="INVALID_OTHER",
                    message=f"Other cost line {line_number}: description is required.",
                    section="other",
                    lineIndex=index,
                )
            )
        if not _is_finite_non_negative(line.amount):
            errors.append(
                EstimateValidationError(
                    code="INVALID_OTHER",
                    message=(
                        f"Other cost line {line_number}: cost must be a finite number that "
                        "is 0 or more."
                    ),
                    section="other",
                    lineIndex=index,
                )
            )

    return errors


def _personnel_cost(line: PersonnelLine) -> float:
    return round_currency(line.people * line.hours * line.hourlyRate)


def calculate_estimate(request: ProjectEstimateRequest) -> EstimateCalculation:
    errors = validate_estimate_request(request)
    if errors:
        return EstimateCalculation(ok=False, errors=tuple(errors))

    result_errors: list[EstimateValidationError] = []

    personnel_results: list[PersonnelResult] = []
    for index, line in enumerate(request.personnel):
        cost = _personnel_cost(line)
        if not math.isfinite(cost):
            result_errors.append(
                EstimateValidationError(
                    code="NON_FINITE_RESULT",
                    message=f"Personnel line {index + 1}: cost is not a finite number.",
                    section="personnel",
                    lineIndex=index,
                )
            )
            continue
        personnel_results.append(
            PersonnelResult(
                role=line.role,
                people=line.people,
                hours=line.hours,
                hourlyRate=line.hourlyRate,
                cost=cost,
            )
        )

    tooling_results: list[ToolingResult] = []
    for index, line in enumerate(request.tooling):
        cost = round_currency(line.amount)
        if not math.isfinite(cost):
            result_errors.append(
                EstimateValidationError(
                    code="NON_FINITE_RESULT",
                    message=f"Tooling line {index + 1}: cost is not a finite number.",
                    section="tooling",
                    lineIndex=index,
                )
            )
            continue
        tooling_results.append(ToolingResult(name=line.name, amount=line.amount, cost=cost))

    infrastructure_results: list[InfrastructureResult] = []
    for index, line in enumerate(request.infrastructure):
        cost = round_currency(line.monthlyCost * line.months)
        if not math.isfinite(cost):
            result_errors.append(
                EstimateValidationError(
                    code="NON_FINITE_RESULT",
                    message=f"Infrastructure line {index + 1}: cost is not a finite number.",
                    section="infrastructure",
                    lineIndex=index,
                )
            )
            continue
        infrastructure_results.append(
            InfrastructureResult(
                name=line.name,
                monthlyCost=line.monthlyCost,
                months=line.months,
                cost=cost,
            )
        )

    other_results: list[OtherCostResult] = []
    for index, line in enumerate(request.other):
        cost = round_currency(line.amount)
        if not math.isfinite(cost):
            result_errors.append(
                EstimateValidationError(
                    code="NON_FINITE_RESULT",
                    message=f"Other cost line {index + 1}: cost is not a finite number.",
                    section="other",
                    lineIndex=index,
                )
            )
            continue
        other_results.append(
            OtherCostResult(
                description=line.description,
                amount=line.amount,
                cost=cost,
            )
        )

    if result_errors:
        return EstimateCalculation(ok=False, errors=tuple(result_errors))

    personnel_cost = round_currency(sum(line.cost for line in personnel_results))
    tooling_cost = round_currency(sum(line.cost for line in tooling_results))
    infrastructure_cost = round_currency(sum(line.cost for line in infrastructure_results))
    other_cost = round_currency(sum(line.cost for line in other_results))
    total = round_currency(personnel_cost + tooling_cost + infrastructure_cost + other_cost)

    if not math.isfinite(total):
        return EstimateCalculation(
            ok=False,
            errors=(
                EstimateValidationError(
                    code="NON_FINITE_RESULT",
                    message="Estimate total is not a finite number.",
                ),
            ),
        )

    result = ProjectEstimateResult(
        projectName=request.projectName,
        currency=request.currency,
        personnel=PersonnelSection(lines=personnel_results, subtotal=personnel_cost),
        tooling=ToolingSection(lines=tooling_results, subtotal=tooling_cost),
        infrastructure=InfrastructureSection(
            lines=infrastructure_results, subtotal=infrastructure_cost
        ),
        other=OtherCostSection(lines=other_results, subtotal=other_cost),
        personnelCost=personnel_cost,
        toolingCost=tooling_cost,
        infrastructureCost=infrastructure_cost,
        otherCost=other_cost,
        lineCount=(
            len(personnel_results)
            + len(tooling_results)
            + len(infrastructure_results)
            + len(other_results)
        ),
        total=total,
        assumptions=build_assumptions(request.currency),
    )
    return EstimateCalculation(ok=True, result=result)


__all__ = [
    "EstimateCalculation",
    "build_assumptions",
    "calculate_estimate",
    "validate_estimate_request",
]
