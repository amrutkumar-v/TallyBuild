"""``POST /api/v1/estimates/calculate`` — run a deterministic estimate."""

from fastapi import APIRouter

from ..errors import ApiError
from ..estimation.calculate import calculate_estimate
from ..schemas import EstimateRequest, EstimateResult

router = APIRouter(prefix="/estimates", tags=["estimates"])


@router.post(
    "/calculate",
    response_model=EstimateResult,
    response_model_exclude_none=True,
)
def calculate(request: EstimateRequest) -> EstimateResult:
    calculation = calculate_estimate(request)
    if not calculation.ok or calculation.result is None:
        details = [error.model_dump(exclude_none=True) for error in calculation.errors]
        if any(error.code == "NON_FINITE_RESULT" for error in calculation.errors):
            raise ApiError(
                500,
                "CALCULATION_ERROR",
                "Estimate calculation failed.",
                details,
            )
        raise ApiError(
            422,
            "VALIDATION_ERROR",
            "Estimate request failed validation.",
            details,
        )
    return calculation.result
