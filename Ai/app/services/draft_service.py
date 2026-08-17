"""
services/draft_service.py

Business logic for producing a professional complaint draft plus its
suggested supporting documents. The LLM generates the draft text
(via the orchestrator, which handles the actual Gemini call); this
service is responsible for attaching the deterministic document
suggestions from the knowledge base, which must NOT come from the LLM.
"""

from __future__ import annotations

from pydantic import BaseModel

from app.core.logging import get_logger
from app.knowledge.knowledge_service import KnowledgeService
from app.models.enums import Language

logger = get_logger(__name__)


class LLMDraftSignal(BaseModel):
    """Raw draft output from the LLM, JSON-validated by
    llm/response_parser.py against the draft_generation.txt prompt's
    expected shape."""

    draft_text: str


class DraftResult(BaseModel):
    """Final draft result including document suggestions."""

    draft_text: str
    suggested_documents: list[str]


class DraftService:
    """Assembles the final draft response from LLM output +
    knowledge-base document requirements.

    Args:
        knowledge_service: Source of required/suggested documents per
            category.
    """

    def __init__(self, knowledge_service: KnowledgeService) -> None:
        self._knowledge = knowledge_service

    def build_result(
        self,
        llm_signal: LLMDraftSignal,
        *,
        category_code: str,
        language: Language,
    ) -> DraftResult:
        """Combine the LLM-generated draft text with the deterministic
        list of suggested documents for the complaint's category.
        """
        required_docs = self._knowledge.get_required_documents(category_code)
        suggested_labels = [
            self._knowledge.get_document_label(doc_code, language.value)
            for doc_code in required_docs
        ]

        logger.info(
            "Built complaint draft",
            extra={"category_code": category_code, "document_count": len(suggested_labels)},
        )

        return DraftResult(
            draft_text=llm_signal.draft_text.strip(),
            suggested_documents=suggested_labels,
        )

    def fallback_draft(
        self,
        *,
        category_code: str,
        language: Language,
        text: str = "",
    ) -> DraftResult:
        """Generate a clean, professional 3-line formal description when LLM is offline or rate limited."""
        category = self._knowledge.get_category(category_code)
        dept_code = category.default_department_code if category else "MUNICIPAL_CORP"
        dept = self._knowledge.get_department(dept_code)
        
        cat_name = category.display_name.get("en", "Civic Grievance") if category else "Civic Grievance"
        dept_name = dept.name if dept else "Municipal Authority"

        line1 = f"Official Grievance Notice regarding {cat_name} routed to {dept_name}."
        line2 = f"Reported Issue Details: {text.strip() if text else category.description}."
        line3 = "Public Urgency: Escalated for immediate municipal site inspection and resolution dispatch."

        draft_text = f"{line1}\n{line2}\n{line3}"
        required_docs = self._knowledge.get_required_documents(category_code)
        suggested_labels = [
            self._knowledge.get_document_display_name(doc_code, language.value)
            for doc_code in required_docs
        ]

        return DraftResult(
            draft_text=draft_text,
            suggested_documents=suggested_labels,
        )
