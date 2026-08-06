"""
api/deps.py

FastAPI dependency providers. This is the ONLY place object graphs are
wired together (GeminiClient -> PromptBuilder -> services ->
AIOrchestrator) — routers never construct services themselves, they
just declare `Depends(get_ai_orchestrator)` etc.

Providers that wrap process-wide singletons (settings, knowledge
service, prompt loader/builder, Gemini client) are cached with
`lru_cache` so they're constructed once per process, not once per
request. Providers for lightweight per-request objects (the services,
the orchestrator) are cheap to construct and are NOT cached, since
they hold no per-request state anyway and this keeps the dependency
graph simple to override in tests via FastAPI's `app.dependency_overrides`.
"""

from __future__ import annotations

from functools import lru_cache

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.knowledge.knowledge_service import KnowledgeService, get_knowledge_service
from app.llm.gemini_client import GeminiClient
from app.llm.prompt_builder import PromptBuilder
from app.llm.prompt_loader import PromptLoader
from app.services.ai_orchestrator import AIOrchestrator
from app.services.classification_service import ClassificationService
from app.services.draft_service import DraftService
from app.services.form_service import FormService
from app.services.translation_service import TranslationService


@lru_cache
def get_prompt_loader() -> PromptLoader:
    """Process-wide PromptLoader (template files don't change at
    runtime, so caching the reader is safe and avoids repeated disk
    I/O per request)."""
    return PromptLoader()


def get_prompt_builder(
    loader: PromptLoader = Depends(get_prompt_loader),
) -> PromptBuilder:
    return PromptBuilder(loader)


@lru_cache
def _cached_gemini_client() -> GeminiClient:
    settings = get_settings()
    return GeminiClient(
        api_key=settings.gemini.api_key.get_secret_value(),
        model_name=settings.gemini.model_name,
        timeout_seconds=settings.gemini.request_timeout_seconds,
        temperature=settings.gemini.temperature,
        max_output_tokens=settings.gemini.max_output_tokens,
    )


def get_gemini_client() -> GeminiClient:
    return _cached_gemini_client()


def get_knowledge_service_dep() -> KnowledgeService:
    """Wraps knowledge/get_knowledge_service for use as a FastAPI
    dependency (keeps the import path consistent with other deps in
    this module, and gives us one place to swap in a fixture-backed
    instance for tests via dependency_overrides)."""
    return get_knowledge_service()


def get_classification_service(
    knowledge_service: KnowledgeService = Depends(get_knowledge_service_dep),
) -> ClassificationService:
    return ClassificationService(knowledge_service)


def get_draft_service(
    knowledge_service: KnowledgeService = Depends(get_knowledge_service_dep),
) -> DraftService:
    return DraftService(knowledge_service)


def get_form_service(
    knowledge_service: KnowledgeService = Depends(get_knowledge_service_dep),
) -> FormService:
    return FormService(knowledge_service)


def get_translation_service() -> TranslationService:
    return TranslationService()


def get_ai_orchestrator(
    settings: Settings = Depends(get_settings),
    gemini_client: GeminiClient = Depends(get_gemini_client),
    prompt_builder: PromptBuilder = Depends(get_prompt_builder),
    classification_service: ClassificationService = Depends(get_classification_service),
    draft_service: DraftService = Depends(get_draft_service),
    translation_service: TranslationService = Depends(get_translation_service),
) -> AIOrchestrator:
    return AIOrchestrator(
        settings=settings,
        gemini_client=gemini_client,
        prompt_builder=prompt_builder,
        classification_service=classification_service,
        draft_service=draft_service,
        translation_service=translation_service,
    )
