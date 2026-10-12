"""FastAPI application factory for the TallyBuild estimation API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import API_PREFIX, DEV_CORS_ORIGINS, SERVICE_VERSION
from .errors import register_error_handlers
from .routers import estimates, health


def create_app() -> FastAPI:
    app = FastAPI(
        title="TallyBuild AI API",
        version=SERVICE_VERSION,
        description=(
            "Deterministic project cost estimation API for software and construction "
            "projects. All figures are illustrative demo data and must not be presented "
            "as verified market prices."
        ),
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(DEV_CORS_ORIGINS),
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_error_handlers(app)

    app.include_router(health.router, prefix=API_PREFIX)
    app.include_router(estimates.router, prefix=API_PREFIX)

    return app


app = create_app()
