"""
api/routers/translation.py

Standalone translation endpoint, usable independently of the
complaint pipeline (e.g. for translating UI strings or guidance text).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_ai_orchestrator
from app.schemas.translation import TranslateRequest, TranslateResponse
from app.services.ai_orchestrator import AIOrchestrator

router = APIRouter(prefix="/api/v1/translate", tags=["translation"])


@router.post("", response_model=TranslateResponse)
async def translate_text(
    request: TranslateRequest,
    orchestrator: AIOrchestrator = Depends(get_ai_orchestrator),
) -> TranslateResponse:
    """Translate text between supported languages (English, Hindi, Odia)."""
    translated_text, detected_source = await orchestrator.translate(
        text=request.text,
        source_language=request.source_language,
        target_language=request.target_language,
    )
    return TranslateResponse(
        translated_text=translated_text,
        detected_source_language=detected_source,
    )
