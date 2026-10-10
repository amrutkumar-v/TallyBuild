"""Deterministic estimate calculation.

Mirrors ``src/estimation/calculate.ts`` exactly: same validation order, same
error codes and messages, same rounding. The backend must not introduce new
calculation rules.
"""

import math
from dataclasses import dataclass, field

from ..schemas import (
    EstimateLineItem,
    EstimateRequest,
    EstimateResult,
    EstimateValidationError,
    LineCalculationResult,
    PriceSource,
)
from .catalogue import SAMPLE_PRODUCT_CATALOGUE, ProductCatalogue, find_product
from .money import round_currency
from .units import are_units_compatible, is_supported_unit


@dataclass(frozen=True)
class EstimateCalculation:
    ok: bool
    result: EstimateResult | None = None
    errors: tuple[EstimateValidationError, ...] = field(default_factory=tuple)


def _is_valid_price_source(source: object) -> bool:
    if not isinstance(source, PriceSource):
        return False
    return (
        isinstance(source.label, str)
        and source.label.strip() != ""
        and isinstance(source.priceDate, str)
        and source.priceDate.strip() != ""
        and source.currency == "INR"
        and source.isIllustrative is True
    )


def _validate_line(
    line: EstimateLineItem,
    index: int,
    catalogue: ProductCatalogue,
) -> list[EstimateValidationError]:
    errors: list[EstimateValidationError] = []
    line_number = index + 1
    product = find_product(catalogue, line.productId)

    if product is None:
        errors.append(
            EstimateValidationError(
                code="MISSING_PRODUCT",
                message=f'Line {line_number}: product "{line.productId}" is not in the catalogue.',
                lineIndex=index,
                productId=line.productId,
            )
        )
        return errors

    quantity = line.quantity
    if not isinstance(quantity, (int, float)) or not math.isfinite(quantity):
        errors.append(
            EstimateValidationError(
                code="INVALID_QUANTITY",
                message=f"Line {line_number}: quantity must be a finite number.",
                lineIndex=index,
                productId=product.id,
            )
        )
    elif quantity < 0:
        errors.append(
            EstimateValidationError(
                code="INVALID_QUANTITY",
                message=f"Line {line_number}: quantity must not be negative.",
                lineIndex=index,
                productId=product.id,
            )
        )

    if line.unit is not None:
        if not is_supported_unit(line.unit):
            errors.append(
                EstimateValidationError(
                    code="INVALID_UNIT",
                    message=f'Line {line_number}: unit "{line.unit}" is not supported.',
                    lineIndex=index,
                    productId=product.id,
                )
            )
        elif line.unit != product.unit:
            if are_units_compatible(line.unit, product.unit):
                errors.append(
                    EstimateValidationError(
                        code="UNIT_CONVERSION_UNSUPPORTED",
                        message=(
                            f'Line {line_number}: unit "{line.unit}" is compatible with '
                            f'"{product.unit}" but unit conversion is not supported yet.'
                        ),
                        lineIndex=index,
                        productId=product.id,
                    )
                )
            else:
                errors.append(
                    EstimateValidationError(
                        code="INCOMPATIBLE_UNIT",
                        message=(
                            f'Line {line_number}: unit "{line.unit}" is incompatible with '
                            f'"{product.unit}".'
                        ),
                        lineIndex=index,
                        productId=product.id,
                    )
                )

    price = product.unitPrice
    if not isinstance(price, (int, float)) or not math.isfinite(price) or price <= 0:
        errors.append(
            EstimateValidationError(
                code="INVALID_PRICE",
                message=f'Line {line_number}: product "{product.id}" has an invalid unit price.',
                lineIndex=index,
                productId=product.id,
            )
        )

    if not _is_valid_price_source(product.priceSource):
        errors.append(
            EstimateValidationError(
                code="INVALID_PRICE_SOURCE",
                message=(
                    f'Line {line_number}: product "{product.id}" is missing price source metadata.'
                ),
                lineIndex=index,
                productId=product.id,
            )
        )

    return errors


def _collect_price_sources(line_results: list[LineCalculationResult]) -> list[PriceSource]:
    sources: list[PriceSource] = []
    for line in line_results:
        source = line.priceSource
        exists = any(
            existing.label == source.label
            and existing.priceDate == source.priceDate
            and existing.currency == source.currency
            for existing in sources
        )
        if not exists:
            sources.append(source)
    return sources


def validate_estimate_request(
    request: EstimateRequest,
    catalogue: ProductCatalogue = SAMPLE_PRODUCT_CATALOGUE,
) -> list[EstimateValidationError]:
    lines = request.lines if isinstance(request.lines, list) else []
    if len(lines) == 0:
        return [
            EstimateValidationError(
                code="EMPTY_REQUEST",
                message="Add at least one line item to calculate an estimate.",
            )
        ]

    errors: list[EstimateValidationError] = []
    for index, line in enumerate(lines):
        errors.extend(_validate_line(line, index, catalogue))
    return errors


def calculate_estimate(
    request: EstimateRequest,
    catalogue: ProductCatalogue = SAMPLE_PRODUCT_CATALOGUE,
) -> EstimateCalculation:
    errors = validate_estimate_request(request, catalogue)
    if errors:
        return EstimateCalculation(ok=False, errors=tuple(errors))

    line_results: list[LineCalculationResult] = []
    result_errors: list[EstimateValidationError] = []

    for index, line in enumerate(request.lines):
        product = find_product(catalogue, line.productId)
        if product is None:
            result_errors.append(
                EstimateValidationError(
                    code="MISSING_PRODUCT",
                    message=(
                        f'Line {index + 1}: product "{line.productId}" is not in the catalogue.'
                    ),
                    lineIndex=index,
                    productId=line.productId,
                )
            )
            continue

        line_subtotal = round_currency(line.quantity * product.unitPrice)
        if not math.isfinite(line_subtotal):
            result_errors.append(
                EstimateValidationError(
                    code="NON_FINITE_RESULT",
                    message=f"Line {index + 1}: subtotal is not a finite number.",
                    lineIndex=index,
                    productId=product.id,
                )
            )
            continue

        line_results.append(
            LineCalculationResult(
                productId=product.id,
                productName=product.name,
                category=product.category,
                unit=line.unit if line.unit is not None else product.unit,
                quantity=line.quantity,
                unitPrice=product.unitPrice,
                lineSubtotal=line_subtotal,
                priceSource=product.priceSource,
                label=line.label,
            )
        )

    if result_errors:
        return EstimateCalculation(ok=False, errors=tuple(result_errors))

    subtotal = round_currency(sum(line.lineSubtotal for line in line_results))
    if not math.isfinite(subtotal):
        return EstimateCalculation(
            ok=False,
            errors=(
                EstimateValidationError(
                    code="NON_FINITE_RESULT",
                    message="Estimate total is not a finite number.",
                ),
            ),
        )

    result = EstimateResult(
        projectName=request.projectName,
        currency="INR",
        itemCount=len(line_results),
        lineResults=line_results,
        subtotal=subtotal,
        total=subtotal,
        priceSources=_collect_price_sources(line_results),
    )
    return EstimateCalculation(ok=True, result=result)
