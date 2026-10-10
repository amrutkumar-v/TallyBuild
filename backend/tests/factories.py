"""Test factories that bypass strict schema validation where a fixture is
intentionally invalid (e.g. a custom catalogue product with unit price ``0``).
"""

from typing import Any

from app.estimation.sample_products import (
    ILLUSTRATIVE_PRICE_SOURCE_LABEL,
    SAMPLE_PRICE_DATE,
)
from app.schemas import MaterialProduct, PriceSource

VALID_SOURCE = PriceSource(
    label=ILLUSTRATIVE_PRICE_SOURCE_LABEL,
    priceDate=SAMPLE_PRICE_DATE,
    currency="INR",
    isIllustrative=True,
)


def make_product(**overrides: Any) -> MaterialProduct:
    data: dict[str, Any] = {
        "id": "test-product",
        "name": "Test Product",
        "category": "Test",
        "unit": "piece",
        "unitPrice": 10,
        "priceSource": VALID_SOURCE,
    }
    data.update(overrides)
    return MaterialProduct.model_construct(**data)
