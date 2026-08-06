"""
exceptions/llm.py

Exceptions raised by the llm/ layer (gemini_client, response_parser,
prompt_builder). Caught primarily by services/ai_orchestrator.py to
drive retry logic and to translate into API-safe error responses.
"""

from __future__ import annotations

from typing import Any

from app.exceptions.base import AavedanSetuError


class LLMError(AavedanSetuError):
    """Base class for all LLM-layer failures."""

    error_code = "LLM_ERROR"


class LLMProviderError(LLMError):
    """The LLM provider (Gemini) call itself failed.

    Covers network errors, timeouts, non-2xx responses, or the
    provider's own reported errors (rate limits, quota, safety
    blocks). Distinct from LLMInvalidJSONError, which means the call
    succeeded but the *content* wasn't usable.
    """

    error_code = "LLM_PROVIDER_ERROR"


class LLMTimeoutError(LLMProviderError):
    """The LLM call exceeded the configured timeout."""

    error_code = "LLM_TIMEOUT"


class LLMInvalidJSONError(LLMError):
    """The LLM returned a response that could not be parsed into
    valid JSON matching the expected schema, even after retries.

    Raised by response_parser.py after exhausting
    `settings.gemini.max_json_retries`. The orchestrator catches this
    to return a structured 502-style error to the API caller rather
    than leaking a raw parse traceback.
    """

    error_code = "LLM_INVALID_JSON"

    def __init__(
        self,
        message: str,
        *,
        raw_response: str | None = None,
        attempts: int = 0,
        details: dict[str, Any] | None = None,
    ) -> None:
        details = details or {}
        if raw_response is not None:
            # Truncate defensively — this may contain citizen complaint
            # text echoed back by the model.
            details.setdefault("raw_response_preview", raw_response[:200])
        details.setdefault("attempts", attempts)
        super().__init__(message, details=details)


class PromptRenderError(LLMError):
    """A prompt template failed to load or render (missing template
    file, missing required template variable, etc.)."""

    error_code = "PROMPT_RENDER_ERROR"
