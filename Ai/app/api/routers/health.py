"""
api/routers/health.py

Liveness/readiness endpoint. Deliberately has zero dependencies on
LLM/knowledge services — it must respond even if Gemini or a
knowledge file is misconfigured, so orchestration tooling (Docker
healthcheck, k8s probes) can distinguish "process is up" from
"process is fully functional".
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.schemas.common import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Basic liveness check."""
    return HealthResponse(status="ok", environment=settings.app.environment)
