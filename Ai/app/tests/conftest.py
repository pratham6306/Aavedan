"""
tests/conftest.py

Shared pytest fixtures.

Key design choice: tests use a FakeGeminiClient (a hand-written stub
implementing the same `async def generate(prompt) -> str` interface
as the real GeminiClient) instead of mocking httpx internals. This
keeps tests focused on "does the orchestrator/service layer behave
correctly given a response", not on Gemini's wire format, and makes
GeminiClient swappable without touching test code.
"""

from __future__ import annotations

import os
from collections.abc import Iterator

import pytest

from app.core.config import get_settings
from app.knowledge.knowledge_service import KnowledgeService
from app.llm.prompt_builder import PromptBuilder
from app.llm.prompt_loader import PromptLoader


@pytest.fixture(autouse=True)
def _test_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Ensure required env vars are present for every test and that
    get_settings()'s cache doesn't leak state between tests.
    """
    monkeypatch.setenv("GEMINI_API_KEY", "test-api-key")
    monkeypatch.setenv("DB_DSN", "postgresql://user:pass@localhost:5432/testdb")
    monkeypatch.setenv("APP_ENVIRONMENT", "local")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def settings():
    return get_settings()


@pytest.fixture
def knowledge_service() -> KnowledgeService:
    """Real KnowledgeService loaded from the actual knowledge/*.yaml
    files. Using the real data (rather than fixtures) here is
    deliberate: it doubles as a regression test that the shipped YAML
    stays valid and cross-referenced correctly.
    """
    service = KnowledgeService()
    service.load()
    return service


@pytest.fixture
def prompt_builder() -> PromptBuilder:
    return PromptBuilder(PromptLoader())


class FakeGeminiClient:
    """Test double for GeminiClient. Returns queued responses in
    order, or a fixed response if only one was provided. Records all
    prompts it was called with for assertions.
    """

    def __init__(self, responses: list[str] | str) -> None:
        self._responses = [responses] if isinstance(responses, str) else list(responses)
        self.calls: list[str] = []

    async def generate(self, prompt: str, image_data: dict | None = None) -> str:
        self.calls.append(prompt)
        if len(self._responses) == 1:
            return self._responses[0]
        return self._responses.pop(0)


@pytest.fixture
def fake_gemini_client_factory():
    """Factory fixture so individual tests can control the canned
    response(s) for their specific scenario."""

    def _make(responses: list[str] | str) -> FakeGeminiClient:
        return FakeGeminiClient(responses)

    return _make
