"""Pydantic schemas for the estimation API.

These models are the single definition of the wire shapes. They mirror the
TypeScript core types in ``src/estimation/types.ts`` and are reused by the
calculation engine and the HTTP routers.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

CurrencyCode = Literal["INR", "USD", "EUR", "AED"]

CostSectionKey = Literal["personnel", "tooling", "infrastructure", "other"]

EstimateErrorCode = Literal[
    "EMPTY_REQUEST",
    "UNSUPPORTED_CURRENCY",
    "INVALID_PERSONNEL",
    "INVALID_TOOLING",
    "INVALID_INFRASTRUCTURE",
    "INVALID_OTHER",
    "NON_FINITE_RESULT",
]


class PersonnelLine(BaseModel):
    model_config = ConfigDict(extra="ignore")

    role: str
    people: float
    hours: float
    hourlyRate: float


class ToolingLine(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    amount: float


class InfrastructureLine(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    monthlyCost: float
    months: float


class OtherCostLine(BaseModel):
    model_config = ConfigDict(extra="ignore")

    description: str
    amount: float


class ProjectEstimateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    projectName: str | None = None
    currency: str = ""
    personnel: list[PersonnelLine] = Field(default_factory=list)
    tooling: list[ToolingLine] = Field(default_factory=list)
    infrastructure: list[InfrastructureLine] = Field(default_factory=list)
    other: list[OtherCostLine] = Field(default_factory=list)

    @field_validator("projectName")
    @classmethod
    def _normalise_project_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None


class PersonnelResult(PersonnelLine):
    cost: float


class ToolingResult(ToolingLine):
    cost: float


class InfrastructureResult(InfrastructureLine):
    cost: float


class OtherCostResult(OtherCostLine):
    cost: float


class PersonnelSection(BaseModel):
    lines: list[PersonnelResult]
    subtotal: float


class ToolingSection(BaseModel):
    lines: list[ToolingResult]
    subtotal: float


class InfrastructureSection(BaseModel):
    lines: list[InfrastructureResult]
    subtotal: float


class OtherCostSection(BaseModel):
    lines: list[OtherCostResult]
    subtotal: float


class ProjectEstimateResult(BaseModel):
    projectName: str | None = None
    currency: CurrencyCode
    personnel: PersonnelSection
    tooling: ToolingSection
    infrastructure: InfrastructureSection
    other: OtherCostSection
    personnelCost: float
    toolingCost: float
    infrastructureCost: float
    otherCost: float
    lineCount: int
    total: float
    assumptions: list[str]


class EstimateValidationError(BaseModel):
    code: EstimateErrorCode
    message: str
    section: CostSectionKey | None = None
    lineIndex: int | None = None


class HealthCapabilities(BaseModel):
    currencies: list[str]
    categories: list[str]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
    timestamp: str
    capabilities: HealthCapabilities
