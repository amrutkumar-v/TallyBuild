"""Pydantic schemas for the estimation API.

These models are the single definition of the wire shapes. They mirror the
TypeScript core types in ``src/estimation/types.ts`` and are reused by the
catalogue, the calculation engine and the HTTP routers.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator

CurrencyCode = Literal["INR"]

EstimateErrorCode = Literal[
    "EMPTY_REQUEST",
    "MISSING_PRODUCT",
    "INVALID_QUANTITY",
    "INVALID_UNIT",
    "INCOMPATIBLE_UNIT",
    "UNIT_CONVERSION_UNSUPPORTED",
    "INVALID_PRICE",
    "INVALID_PRICE_SOURCE",
    "NON_FINITE_RESULT",
]


class PriceSource(BaseModel):
    model_config = ConfigDict(extra="ignore")

    label: str
    priceDate: str
    currency: CurrencyCode
    isIllustrative: bool


class MaterialProduct(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    category: str
    unit: str
    unitPrice: float
    priceSource: PriceSource


class EstimateLineItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    productId: str
    quantity: float
    unit: str | None = None
    label: str | None = None


class EstimateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    projectName: str | None = None
    lines: list[EstimateLineItem]

    @field_validator("projectName")
    @classmethod
    def _normalise_project_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None


class EstimateValidationError(BaseModel):
    code: EstimateErrorCode
    message: str
    lineIndex: int | None = None
    productId: str | None = None


class LineCalculationResult(BaseModel):
    productId: str
    productName: str
    category: str
    unit: str
    quantity: float
    unitPrice: float
    lineSubtotal: float
    priceSource: PriceSource
    label: str | None = None


class EstimateResult(BaseModel):
    projectName: str | None = None
    currency: CurrencyCode
    itemCount: int
    lineResults: list[LineCalculationResult]
    subtotal: float
    total: float
    priceSources: list[PriceSource]


class CatalogueInfo(BaseModel):
    products: int
    currency: CurrencyCode


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
    timestamp: str
    catalogue: CatalogueInfo


class ProductListResponse(BaseModel):
    count: int
    products: list[MaterialProduct]
