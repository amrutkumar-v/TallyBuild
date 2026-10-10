"""Deterministic estimation core (pure, no FastAPI/network imports)."""

from .calculate import EstimateCalculation, calculate_estimate, validate_estimate_request
from .catalogue import (
    SAMPLE_PRODUCT_CATALOGUE,
    ProductCatalogue,
    create_catalogue,
    find_product,
    list_products,
)
from .money import CURRENCY_DECIMALS, round_currency
from .sample_products import (
    ILLUSTRATIVE_PRICE_SOURCE_LABEL,
    SAMPLE_PRICE_DATE,
    SAMPLE_PRODUCTS,
)
from .units import (
    SUPPORTED_UNITS,
    MeasurementUnit,
    UnitFamily,
    are_units_compatible,
    get_unit_family,
    get_unit_label,
    is_supported_unit,
)

__all__ = [
    "CURRENCY_DECIMALS",
    "ILLUSTRATIVE_PRICE_SOURCE_LABEL",
    "SAMPLE_PRODUCT_CATALOGUE",
    "SAMPLE_PRICE_DATE",
    "SAMPLE_PRODUCTS",
    "SUPPORTED_UNITS",
    "EstimateCalculation",
    "MeasurementUnit",
    "ProductCatalogue",
    "UnitFamily",
    "are_units_compatible",
    "calculate_estimate",
    "create_catalogue",
    "find_product",
    "get_unit_family",
    "get_unit_label",
    "is_supported_unit",
    "list_products",
    "round_currency",
    "validate_estimate_request",
]
