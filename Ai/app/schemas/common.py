"""
schemas/common.py

Shared API-layer schemas: the standard error response envelope and
common metadata. Every FastAPI exception handler in api/ maps
exceptions (see exceptions/) to `ErrorResponse` so callers get a
single, predictable error shape regardless of which layer failed.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error envelope returned for any 4xx/5xx response."""

    error_code: str = Field(description="Stable machine-readable error identifier.")
    message: str = Field(description="Human-readable error description.")
    details: dict[str, Any] = Field(default_factory=dict)
    request_id: str | None = Field(
        default=None,
        description="Correlates this error with server-side logs.",
    )


class HealthResponse(BaseModel):
    """Response for the liveness/readiness health-check endpoint."""

    status: str = "ok"
    environment: str
    version: str = "0.1.0"
