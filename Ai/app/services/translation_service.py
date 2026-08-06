"""
services/translation_service.py

Thin business layer over LLM-driven translation. Exists mainly to
keep a consistent shape with the other services (validated input
schema -> LLM signal -> result) and as the seam where non-LLM
translation logic (e.g. a future dictionary-based fast path for
common phrases) could be added without touching the orchestrator.
"""

from __future__ import annotations

from pydantic import BaseModel

from app.core.logging import get_logger
from app.models.enums import Language

logger = get_logger(__name__)


class LLMTranslationSignal(BaseModel):
    """Raw translation output from the LLM, JSON-validated by
    llm/response_parser.py against the translation.txt prompt's
    expected shape."""

    translated_text: str


class TranslationService:
    """Business logic for the translation feature."""

    def build_result(
        self, llm_signal: LLMTranslationSignal, *, detected_source_language: Language
    ) -> tuple[str, Language]:
        """Return the final (translated_text, detected_source_language)
        pair for the API response."""
        logger.info(
            "Completed translation",
            extra={"detected_source_language": detected_source_language.value},
        )
        return llm_signal.translated_text.strip(), detected_source_language
