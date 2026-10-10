"""``GET /api/v1/health`` — liveness/readiness probe."""

from datetime import UTC, datetime

from fastapi import APIRouter

from ..config import CURRENCY, SERVICE_NAME, SERVICE_VERSION
from ..estimation.catalogue import SAMPLE_PRODUCT_CATALOGUE
from ..schemas import CatalogueInfo, HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
def get_health() -> HealthResponse:
    now = datetime.now(UTC)
    timestamp = now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"
    return HealthResponse(
        status="ok",
        service=SERVICE_NAME,
        version=SERVICE_VERSION,
        timestamp=timestamp,
        catalogue=CatalogueInfo(
            products=len(SAMPLE_PRODUCT_CATALOGUE.products),
            currency=CURRENCY,
        ),
    )
