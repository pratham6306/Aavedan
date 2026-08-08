"""
main.py
# Triggering uvicorn reload with new API key configuration.

Application entrypoint. Responsible only for assembling the FastAPI
app object: configure logging, construct the app, register exception
handlers, mount routers. No business logic, no route definitions —
those live in api/routers/ and services/ respectively.

Run locally with:
    uvicorn app.main:app --reload

In Docker, the same import path (app.main:app) is what the container
CMD points at.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI

from app.api.error_handlers import register_exception_handlers
from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.knowledge.knowledge_service import get_knowledge_service

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup/shutdown hook.

    On startup: eagerly load and validate the knowledge base so a
    malformed categories.yaml/departments.yaml fails the container's
    startup probe immediately, rather than surfacing as a 500 on the
    first request that happens to need it.
    """
    settings = get_settings()
    logger.info(
        "Starting Aavedan Setu AI Assistant",
        extra={"environment": settings.app.environment},
    )

    get_knowledge_service()  # triggers load() + cross-reference validation
    logger.info("Knowledge base loaded and validated")

    yield

    logger.info("Shutting down Aavedan Setu AI Assistant")


def create_app() -> FastAPI:
    """Construct and configure the FastAPI application.

    Factory function (rather than a bare module-level `app = FastAPI()`
    with side effects sprinkled around it) so tests can call this
    directly to get a fresh app instance with overridden dependencies.
    """
    settings = get_settings()
    configure_logging(settings)

    app = FastAPI(
        title=settings.app.name,
        debug=settings.app.debug,
        lifespan=lifespan,
    )

    register_exception_handlers(app)
    app.include_router(api_router)

    return app


app = create_app()
