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

import asyncio
import random
from app.core.config import get_dynamic_gemini_api_keys

_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiClient:
    """Async client for calling the Gemini generateContent endpoint with multi-key rotation & failover.

    Args:
        api_key: Optional single API key or list of keys. If omitted, dynamically reloads from .env.
        model_name: Model identifier, e.g. "gemini-1.5-flash".
        timeout_seconds: Per-request timeout.
        temperature: Sampling temperature.
        max_output_tokens: Max tokens in the generated response.
    """

    def __init__(
        self,
        *,
        api_key: str | list[str] | None = None,
        model_name: str = "gemini-flash-latest",
        timeout_seconds: float = 30.0,
        temperature: float = 0.2,
        max_output_tokens: int = 2048,
    ) -> None:
        self._initial_api_key = api_key
        self._model_name = model_name
        self._timeout_seconds = timeout_seconds
        self._temperature = temperature
        self._max_output_tokens = max_output_tokens
        self._key_index = 0

    def _get_active_keys(self) -> list[str]:
        keys = get_dynamic_gemini_api_keys()
        if self._initial_api_key:
            if isinstance(self._initial_api_key, list):
                keys = self._initial_api_key + keys
            elif isinstance(self._initial_api_key, str) and self._initial_api_key not in keys and self._initial_api_key != "dev_key":
                keys.insert(0, self._initial_api_key)
        return keys if keys else ["dev_key"]

    async def generate(self, prompt: str, image_data: dict | None = None) -> str:
        """Send `prompt` to Gemini with automatic multi-key rotation and 429/503 resilience."""
        keys = self._get_active_keys()
        # Strictly use verified active model aliases
        models = [self._model_name, "gemini-flash-latest"]
        models = list(dict.fromkeys(models))

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
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ],
        }

        # Allow 2 full passes over all keys strictly using verified gemini-flash-latest model
        max_attempts = len(keys) * 2
        last_error = None
        current_model = "gemini-flash-latest"

        for attempt in range(max_attempts):
            current_key = keys[self._key_index % len(keys)]
            key_num = (self._key_index % len(keys)) + 1

            url = f"{_GEMINI_BASE_URL}/{current_model}:generateContent"
            headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": current_key,
            }

            try:
                async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                    response = await client.post(url, json=payload, headers=headers)

                if response.status_code == 200:
                    text = self._extract_text(response.json())
                    if text:
                        return text

                logger.warning(
                    f"Gemini API returned status {response.status_code} for model '{current_model}' on Key #{key_num} of {len(keys)} (Attempt {attempt+1}/{max_attempts}). Rotating key..."
                )
                last_error = f"Status {response.status_code}: {response.text[:200]}"
                self._key_index = (self._key_index + 1) % len(keys)

                # Pause briefly (0.4s) on 503/429 so Google's backend cluster queue clears
                if response.status_code in [503, 429, 502, 504]:
                    await asyncio.sleep(0.35 + random.uniform(0.05, 0.15))
                continue

            except (httpx.TimeoutException, httpx.HTTPError, Exception) as exc:
                logger.warning(f"Gemini request error on Key #{key_num} of {len(keys)} ({current_model}): {exc}. Rotating to next key...")
                self._key_index = (self._key_index + 1) % len(keys)
                last_error = exc
                await asyncio.sleep(0.3)

        raise LLMProviderError(f"All {len(keys)} Gemini API keys failed after 2 passes ({max_attempts} attempts). Last error: {last_error}")

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
