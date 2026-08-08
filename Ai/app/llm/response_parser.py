"""
llm/response_parser.py

Turns a raw LLM text response into a validated Pydantic model.

Handles the reality that LLMs (Gemini included) sometimes wrap JSON
in prose or markdown code fences ("Sure! ```json { ... } ```")
instead of returning pure JSON, despite being instructed not to.

Responsibilities:
    1. Extract the JSON substring from raw text (strip fences/prose).
    2. Parse it and validate against the expected Pydantic schema.
    3. On failure, drive a bounded retry loop that re-prompts Gemini
       with a corrective "your last response was invalid" prompt.
    4. Raise LLMInvalidJSONError if all retries are exhausted.

This module depends on GeminiClient and PromptBuilder (for building
the corrective retry prompt), which is a deliberate exception to the
usual "llm/ modules don't know about each other" separation — the
retry loop inherently needs to re-call the model, and keeping that
loop here (rather than duplicating it in every service) is what makes
"never return malformed JSON" a property of the llm/ layer as a
whole, not something every service has to remember to implement.
"""

from __future__ import annotations

import json
import re
from typing import TypeVar

from pydantic import BaseModel, ValidationError

from app.core.logging import get_logger, redact
from app.exceptions.llm import LLMInvalidJSONError
from app.llm.gemini_client import GeminiClient
from app.llm.prompt_builder import PromptBuilder

logger = get_logger(__name__)

_SchemaT = TypeVar("_SchemaT", bound=BaseModel)

_JSON_FENCE_PATTERN = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)
_JSON_OBJECT_PATTERN = re.compile(r"\{.*\}", re.DOTALL)


def extract_json_text(raw_text: str) -> str:
    """Best-effort extraction of a JSON object substring from raw LLM
    text.

    Tries, in order:
        1. Content inside a ```json ... ``` or ``` ... ``` fence.
        2. The first `{...}`-bounded substring in the text.
        3. The raw text as-is (in case it's already pure JSON).
    """
    fence_match = _JSON_FENCE_PATTERN.search(raw_text)
    if fence_match:
        return fence_match.group(1).strip()

    object_match = _JSON_OBJECT_PATTERN.search(raw_text)
    if object_match:
        return object_match.group(0).strip()

    return raw_text.strip()


def parse_and_validate(raw_text: str, schema: type[_SchemaT]) -> _SchemaT:
    """Extract JSON from `raw_text` and validate it against `schema`.

    Raises:
        LLMInvalidJSONError: if extraction, JSON parsing, or schema
            validation fails.
    """
    json_text = extract_json_text(raw_text)

    try:
        data = json.loads(json_text)
    except json.JSONDecodeError as exc:
        raise LLMInvalidJSONError(
            f"Could not parse JSON from LLM response: {exc}",
            raw_response=raw_text,
        ) from exc

    try:
        return schema.model_validate(data)
    except ValidationError as exc:
        raise LLMInvalidJSONError(
            f"LLM response JSON did not match expected schema: {exc}",
            raw_response=raw_text,
        ) from exc


async def parse_with_retries(
    *,
    initial_response: str,
    schema: type[_SchemaT],
    client: GeminiClient,
    prompt_builder: PromptBuilder,
    max_retries: int,
    image_data: dict | None = None,
) -> _SchemaT:
    """Attempt to parse `initial_response`, retrying against Gemini
    with a corrective prompt up to `max_retries` times on failure.

    Args:
        initial_response: The first raw response already received
            from Gemini (the caller already made one call; this
            function only issues additional calls if that one fails
            to parse).
        schema: Pydantic model the parsed JSON must validate against.
        client: GeminiClient used to issue corrective retry calls.
        prompt_builder: Used to render the json_correction.txt
            template for each retry.
        max_retries: Maximum number of corrective retry calls (in
            addition to the initial attempt).
        image_data: Optional dictionary containing image mimeType and base64 data.

    Raises:
        LLMInvalidJSONError: if valid JSON still isn't obtained after
            exhausting all retries.
    """
    current_response = initial_response
    last_error: LLMInvalidJSONError | None = None

    for attempt in range(max_retries + 1):
        try:
            return parse_and_validate(current_response, schema)
        except LLMInvalidJSONError as exc:
            last_error = exc
            logger.warning(
                "LLM response failed JSON validation, will retry" if attempt < max_retries
                else "LLM response failed JSON validation, retries exhausted",
                extra={
                    "attempt": attempt,
                    "max_retries": max_retries,
                    "response_preview": redact(current_response),
                },
            )
            if attempt >= max_retries:
                break

            correction_prompt = prompt_builder.build(
                "json_correction.txt",
                schema_description=_schema_description(schema),
                previous_response=current_response,
            )
            current_response = await client.generate(correction_prompt, image_data=image_data)

    assert last_error is not None  # loop always sets this before breaking
    raise LLMInvalidJSONError(
        f"LLM failed to produce valid JSON after {max_retries} retries",
        raw_response=current_response,
        attempts=max_retries + 1,
    ) from last_error


def _schema_description(schema: type[BaseModel]) -> str:
    """Render a schema's field names/types as a human-readable
    description for inclusion in the corrective retry prompt."""
    fields = schema.model_fields
    lines = [f"- {name}: {field.annotation}" for name, field in fields.items()]
    return "\n".join(lines)
