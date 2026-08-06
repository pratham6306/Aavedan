"""
schemas/translation.py

Request/response contracts for POST /api/v1/translate.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import Language


class TranslateRequest(BaseModel):
    """Request to translate text between supported languages."""

    text: str = Field(min_length=1, max_length=5000)
    source_language: Language | None = Field(
        default=None, description="Auto-detected if omitted."
    )
    target_language: Language


class TranslateResponse(BaseModel):
    """Translated text result."""

    translated_text: str
    detected_source_language: Language
