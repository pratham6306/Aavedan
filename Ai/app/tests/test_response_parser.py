"""tests/test_response_parser.py"""

from __future__ import annotations

import pytest
from pydantic import BaseModel

from app.exceptions.llm import LLMInvalidJSONError
from app.llm.prompt_builder import PromptBuilder
from app.llm.response_parser import (
    extract_json_text,
    parse_and_validate,
    parse_with_retries,
)


class _Sample(BaseModel):
    name: str
    count: int


def test_extract_json_from_markdown_fence() -> None:
    raw = 'Sure! Here you go:\n```json\n{"name": "a", "count": 1}\n```\nHope that helps.'
    assert extract_json_text(raw) == '{"name": "a", "count": 1}'


def test_extract_json_from_bare_object() -> None:
    raw = 'Here is the result: {"name": "a", "count": 1} thanks.'
    assert extract_json_text(raw) == '{"name": "a", "count": 1}'


def test_parse_and_validate_success() -> None:
    result = parse_and_validate('{"name": "a", "count": 1}', _Sample)
    assert result.name == "a"
    assert result.count == 1


def test_parse_and_validate_invalid_json_raises() -> None:
    with pytest.raises(LLMInvalidJSONError):
        parse_and_validate("not json at all", _Sample)


def test_parse_and_validate_schema_mismatch_raises() -> None:
    with pytest.raises(LLMInvalidJSONError):
        # missing required field "count"
        parse_and_validate('{"name": "a"}', _Sample)


@pytest.mark.asyncio
async def test_parse_with_retries_succeeds_on_first_try(
    fake_gemini_client_factory, prompt_builder: PromptBuilder
) -> None:
    client = fake_gemini_client_factory('{"name": "a", "count": 1}')
    result = await parse_with_retries(
        initial_response='{"name": "a", "count": 1}',
        schema=_Sample,
        client=client,
        prompt_builder=prompt_builder,
        max_retries=2,
    )
    assert result.name == "a"
    assert len(client.calls) == 0  # no retry call needed


@pytest.mark.asyncio
async def test_parse_with_retries_recovers_after_one_bad_response(
    fake_gemini_client_factory, prompt_builder: PromptBuilder
) -> None:
    client = fake_gemini_client_factory(['{"name": "a", "count": 1}'])
    result = await parse_with_retries(
        initial_response="not valid json",
        schema=_Sample,
        client=client,
        prompt_builder=prompt_builder,
        max_retries=2,
    )
    assert result.name == "a"
    assert len(client.calls) == 1  # exactly one corrective retry issued


@pytest.mark.asyncio
async def test_parse_with_retries_exhausts_and_raises(
    fake_gemini_client_factory, prompt_builder: PromptBuilder
) -> None:
    client = fake_gemini_client_factory(["still not json", "still not json"])
    with pytest.raises(LLMInvalidJSONError):
        await parse_with_retries(
            initial_response="not valid json",
            schema=_Sample,
            client=client,
            prompt_builder=prompt_builder,
            max_retries=2,
        )
    assert len(client.calls) == 2
