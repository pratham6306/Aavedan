"""
llm/gemini_client.py

Thin async wrapper around the Gemini generateContent REST API.

Responsibility boundary (important, per project rules): this client
does ONE thing — send a prompt string, return the raw text response.
It does NOT parse/validate JSON (see response_parser.py), does NOT
know about complaints/categories/departments, and does NOT implement
retry-on-invalid-JSON logic (that's an orchestration concern, since
retrying requires re-building a corrective prompt, which this client
has no knowledge of).

Uses httpx directly against the REST endpoint rather than the
`google-generativeai` SDK, to keep the dependency surface small and
the request/response shape fully under our control (easier to mock
in tests, no SDK version churn to track).
"""

from __future__ import annotations

import httpx

from app.core.logging import get_logger
from app.exceptions.llm import LLMProviderError, LLMTimeoutError

logger = get_logger(__name__)

_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiClient:
    """Async client for calling the Gemini generateContent endpoint.

    Args:
        api_key: Gemini API key (from settings.gemini.api_key).
        model_name: Model identifier, e.g. "gemini-1.5-pro".
        timeout_seconds: Per-request timeout.
        temperature: Sampling temperature.
        max_output_tokens: Max tokens in the generated response.
    """

    def __init__(
        self,
        *,
        api_key: str,
        model_name: str,
        timeout_seconds: float = 30.0,
        temperature: float = 0.2,
        max_output_tokens: int = 2048,
    ) -> None:
        self._api_key = api_key
        self._model_name = model_name
        self._timeout_seconds = timeout_seconds
        self._temperature = temperature
        self._max_output_tokens = max_output_tokens

    async def generate(self, prompt: str, image_data: dict | None = None) -> str:
        """Send `prompt` to Gemini and return the raw text response.

        Args:
            prompt: Fully-rendered prompt text (already built via
                PromptBuilder — this method does no templating).
            image_data: Optional dictionary containing "mimeType" and "data" (base64 string).

        Returns:
            The raw text content of the model's response. May or may
            not be valid JSON — that's response_parser's concern.

        Raises:
            LLMTimeoutError: if the request exceeds the configured
                timeout.
            LLMProviderError: for any other network error, non-2xx
                response, or a response with no usable text content
                (e.g. blocked by safety filters).
        """
        url = f"{_GEMINI_BASE_URL}/{self._model_name}:generateContent"
        parts = [{"text": prompt}]
        if image_data:
            parts.append({
                "inlineData": {
                    "mimeType": image_data["mimeType"],
                    "data": image_data["data"]
                }
            })
        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": self._temperature,
                "maxOutputTokens": self._max_output_tokens,
            },
        }
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self._api_key,
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                response = await client.post(url, json=payload, headers=headers)
        except httpx.TimeoutException as exc:
            logger.warning("Gemini request timed out", extra={"model": self._model_name})
            raise LLMTimeoutError(
                f"Gemini request timed out after {self._timeout_seconds}s"
            ) from exc
        except httpx.HTTPError as exc:
            logger.error("Gemini request failed", extra={"error": str(exc)})
            raise LLMProviderError(f"Gemini request failed: {exc}") from exc

        if response.status_code != 200:
            logger.error(
                "Gemini returned non-200 response",
                extra={"status_code": response.status_code, "body": response.text[:500]},
            )
            raise LLMProviderError(
                f"Gemini returned status {response.status_code}",
                details={"status_code": response.status_code},
            )

        return self._extract_text(response.json())

    @staticmethod
    def _extract_text(body: dict) -> str:
        """Pull the generated text out of a Gemini response body.

        Raises:
            LLMProviderError: if no candidate/text is present, which
                typically means the response was blocked by safety
                filters or the request was malformed.
        """
        candidates = body.get("candidates") or []
        if not candidates:
            raise LLMProviderError(
                "Gemini response contained no candidates (possibly blocked)",
                details={"finish_reason": body.get("promptFeedback")},
            )

        parts = candidates[0].get("content", {}).get("parts") or []
        text_parts = [p.get("text", "") for p in parts if "text" in p]
        if not text_parts:
            raise LLMProviderError("Gemini response contained no text content")

        return "".join(text_parts)
