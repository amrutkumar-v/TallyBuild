"""Static configuration for the TallyBuild estimation API."""

from typing import Final

SERVICE_NAME: Final[str] = "tallybuild-api"
SERVICE_VERSION: Final[str] = "0.1.0"
API_PREFIX: Final[str] = "/api/v1"
CURRENCY: Final[str] = "INR"

DEV_CORS_ORIGINS: Final[tuple[str, ...]] = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)
