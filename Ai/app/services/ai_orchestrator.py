"""
services/ai_orchestrator.py

The single coordination point for the full AI pipeline:

    Citizen Input
        -> Preprocessing (utils/text.py)
        -> Prompt Builder (llm/prompt_builder.py)
        -> Gemini (llm/gemini_client.py)
        -> JSON Validation + retry (llm/response_parser.py)
        -> Business Logic (services/*_service.py, knowledge/)
        -> Final structured result

Every API route calls into this orchestrator rather than wiring
together llm/ and services/ calls itself — this is what keeps
api/routers/*.py thin and ensures the pipeline order (and retry
behavior) is defined in exactly one place.
"""

from __future__ import annotations

import uuid

from app.core.config import Settings
from app.core.logging import get_logger
from app.llm.gemini_client import GeminiClient
from app.llm.prompt_builder import PromptBuilder
from app.llm.response_parser import parse_with_retries
from app.models.complaint import Complaint
from app.models.enums import ComplaintStatus, Language
from app.services.classification_service import (
    ClassificationService,
    LLMClassificationSignal,
)
from app.services.draft_service import DraftService, LLMDraftSignal
from app.services.translation_service import LLMTranslationSignal, TranslationService
from app.utils.text import clean_text, detect_language

logger = get_logger(__name__)


class AIOrchestrator:
    """Coordinates the end-to-end AI pipeline for all complaint
    processing features.

    All dependencies are constructor-injected (DI per project
    principles), which makes this class straightforward to unit test
    with fakes/mocks for GeminiClient and the individual services.
    """

    def __init__(
        self,
        *,
        settings: Settings,
        gemini_client: GeminiClient,
        prompt_builder: PromptBuilder,
        classification_service: ClassificationService,
        draft_service: DraftService,
        translation_service: TranslationService,
    ) -> None:
        self._settings = settings
        self._client = gemini_client
        self._prompt_builder = prompt_builder
        self._classification_service = classification_service
        self._draft_service = draft_service
        self._translation_service = translation_service

    # -- classification ---------------------------------------------

    async def classify_complaint(
        self, raw_text: str, declared_language: Language | None, image_base64: str | None = None
    ) -> Complaint:
        """Run the full classification pipeline on a raw complaint.

        Steps: preprocess -> detect language -> build classification
        prompt -> call Gemini -> validate JSON (with retry) -> resolve
        business rules (category/department/priority) -> assemble
        Complaint.
        """
        cleaned_text = clean_text(raw_text)
        language = declared_language or detect_language(cleaned_text)

        categories = self._classification_service.list_categories()
        category_list = self._prompt_builder.format_category_list(
            categories, language.value
        )

        prompt = self._prompt_builder.build(
            "classification.txt",
            language=language.value,
            category_list=category_list,
            complaint_text=cleaned_text,
        )

        image_data = None
        if image_base64:
            mime_type = "image/jpeg"
            base64_data = image_base64
            if "," in image_base64:
                header, base64_data = image_base64.split(",", 1)
                if "data:" in header and ";base64" in header:
                    mime_type = header.split(";", 1)[0].replace("data:", "")
            image_data = {"mimeType": mime_type, "data": base64_data}

        raw_response = await self._client.generate(prompt, image_data=image_data)
        signal = await parse_with_retries(
            initial_response=raw_response,
            schema=LLMClassificationSignal,
            client=self._client,
            prompt_builder=self._prompt_builder,
            max_retries=self._settings.gemini.max_json_retries,
            image_data=image_data,
        )

        result = self._classification_service.resolve(signal)

        complaint = Complaint(
            id=uuid.uuid4(),
            status=ComplaintStatus.CLASSIFIED,
            original_text=cleaned_text,
            detected_language=language,
            category=result.category,
            department=result.department,
            entities=result.entities,
            priority=result.priority,
            classification_confidence=result.confidence,
        )

        logger.info(
            "Classified complaint",
            extra={"complaint_id": str(complaint.id), "category": result.category.code},
        )
        return complaint

    # -- draft generation ---------------------------------------------

    async def generate_draft(
        self, raw_text: str, language: Language | None, category_code: str | None
    ) -> tuple[str, str, list[str], Language]:
        """Run the draft-generation pipeline.

        If `category_code` is not provided, classification runs first
        to determine it (needed for document suggestions and prompt
        context).

        Returns:
            (complaint_id, draft_text, suggested_documents, language_used)
        """
        cleaned_text = clean_text(raw_text)
        detected_language = language or detect_language(cleaned_text)

        if category_code is None:
            complaint = await self.classify_complaint(cleaned_text, detected_language)
            category_code = complaint.category.code
            complaint_id = str(complaint.id)
        else:
            complaint_id = str(uuid.uuid4())

        category = self._classification_service._knowledge.get_category(  # noqa: SLF001
            category_code
        )

        prompt = self._prompt_builder.build(
            "draft_generation.txt",
            language=detected_language.value,
            category_display_name=category.display_name.get(
                detected_language.value, category.display_name.get("en", category.code)
            ),
            complaint_text=cleaned_text,
        )

        raw_response = await self._client.generate(prompt)
        signal = await parse_with_retries(
            initial_response=raw_response,
            schema=LLMDraftSignal,
            client=self._client,
            prompt_builder=self._prompt_builder,
            max_retries=self._settings.gemini.max_json_retries,
        )

        result = self._draft_service.build_result(
            signal, category_code=category_code, language=detected_language
        )

        logger.info("Generated complaint draft", extra={"complaint_id": complaint_id})
        return complaint_id, result.draft_text, result.suggested_documents, detected_language

    # -- translation ---------------------------------------------

    async def translate(
        self, text: str, source_language: Language | None, target_language: Language
    ) -> tuple[str, Language]:
        """Run the translation pipeline."""
        cleaned_text = clean_text(text)
        detected_source = source_language or detect_language(cleaned_text)

        prompt = self._prompt_builder.build(
            "translation.txt",
            source_language=detected_source.value,
            target_language=target_language.value,
            text=cleaned_text,
        )

        raw_response = await self._client.generate(prompt)
        signal = await parse_with_retries(
            initial_response=raw_response,
            schema=LLMTranslationSignal,
            client=self._client,
            prompt_builder=self._prompt_builder,
            max_retries=self._settings.gemini.max_json_retries,
        )

        translated_text, detected = self._translation_service.build_result(
            signal, detected_source_language=detected_source
        )
        return translated_text, detected

    # -- schemes recommendation ---------------------------------------

    async def recommend_schemes(
        self, user_description: str, schemes: list[SchemeInputSchema]
    ) -> LLMRecommendSchemesSignal:
        """Evaluate user eligibility for candidate schemes using Gemini."""
        formatted_schemes = []
        for s in schemes:
            formatted_schemes.append(
                f"Scheme ID: {s.id}\n"
                f"Name: {s.scheme_name}\n"
                f"Description: {s.description}\n"
                f"Benefits: {s.benefits}\n"
                f"Eligibility Criteria: {s.eligibility}\n"
                f"Required Documents: {', '.join(s.required_documents)}\n"
                f"----------------------------------------"
            )
        schemes_data = "\n".join(formatted_schemes)

        prompt = self._prompt_builder.build(
            "scheme_recommendation.txt",
            user_description=user_description,
            schemes_data=schemes_data,
        )

        raw_response = await self._client.generate(prompt)
        signal = await parse_with_retries(
            initial_response=raw_response,
            schema=LLMRecommendSchemesSignal,
            client=self._client,
            prompt_builder=self._prompt_builder,
            max_retries=self._settings.gemini.max_json_retries,
        )
        return signal


from pydantic import BaseModel, Field
from app.schemas.schemes import SchemeInputSchema


class LLMSchemeRecommendation(BaseModel):
    scheme_id: int
    scheme_name: str
    is_eligible: bool
    matching_reason: str
    required_documents: list[str] = Field(default_factory=list)
    filling_instructions: str


class LLMRecommendSchemesSignal(BaseModel):
    recommendations: list[LLMSchemeRecommendation]

