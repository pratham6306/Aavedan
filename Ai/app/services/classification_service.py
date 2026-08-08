"""
services/classification_service.py

Business logic for turning an LLM classification result into a fully
resolved Complaint: validated category/department, extracted
entities, and a final (Python-decided, not LLM-decided) priority
level.

Does NOT call Gemini directly — receives already-parsed LLM output
from the orchestrator (see services/ai_orchestrator.py) and layers
deterministic business rules on top, per the project rule that
priority decisions and routing must live in backend code, not be
handed off wholesale to the LLM.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.core.logging import get_logger
from app.knowledge.knowledge_service import KnowledgeService
from app.models.category import Category
from app.models.department import Department
from app.models.entity import ExtractedEntities
from app.models.priority import PriorityAssessment

logger = get_logger(__name__)


class LLMClassificationSignal(BaseModel):
    """Raw classification output from the LLM, already JSON-validated
    by llm/response_parser.py. This is the schema the classification
    prompt's output is validated against.
    """

    category_code: str
    confidence: float = Field(ge=0.0, le=1.0)
    entities: ExtractedEntities
    llm_signals: list[str] = Field(default_factory=list)
    image_priority: str | None = Field(default=None, description="Priority determined by image analysis.")


class ClassificationResult(BaseModel):
    """Fully resolved classification: category, department, priority,
    and entities, ready to attach to a Complaint."""

    category: Category
    department: Department
    entities: ExtractedEntities
    priority: PriorityAssessment
    confidence: float


class ClassificationService:
    """Applies business rules to LLM classification output.

    Args:
        knowledge_service: Source of truth for categories, departments,
            and priority rules. Injected so tests can supply a fake
            with fixture data.
    """

    def __init__(self, knowledge_service: KnowledgeService) -> None:
        self._knowledge = knowledge_service

    def list_categories(self) -> list[Category]:
        """Return all known categories, e.g. for building the
        classification prompt's allowed-category list. Exposed here
        rather than requiring callers to reach into knowledge_service
        directly, keeping KnowledgeService access behind this
        service's own boundary."""
        return self._knowledge.get_all_categories()

    def get_category(self, category_code: str) -> Category:
        """Look up a single category by code."""
        return self._knowledge.get_category(category_code)

    def resolve(self, signal: LLMClassificationSignal) -> ClassificationResult:
        """Turn a raw LLM classification signal into a fully resolved
        result, applying knowledge-base lookups and priority rules.

        Unknown category codes from the LLM are NOT silently coerced
        to a default — they raise (via knowledge_service) so the
        orchestrator can decide whether to retry the classification
        call, since an unknown category usually means the LLM ignored
        the allowed-list constraint in the prompt.
        """
        category = self._knowledge.get_category(signal.category_code)
        department = self._knowledge.get_department(category.default_department_code)
        
        priority = None
        if signal.image_priority:
            from app.models.enums import PriorityLevel
            try:
                img_lvl = PriorityLevel(signal.image_priority.lower().strip())
                priority = PriorityAssessment(
                    level=img_lvl,
                    reason=f"Priority assessed from image: {img_lvl.value}.",
                    matched_rule_id="image_vision"
                )
            except Exception:
                pass

        if not priority:
            priority = self._resolve_priority(category.code, signal.llm_signals)

        if not priority or not priority.level:
            from app.models.enums import PriorityLevel
            priority = PriorityAssessment(
                level=PriorityLevel.MEDIUM,
                reason="No priority determined; defaulted to MEDIUM.",
                matched_rule_id="default_medium"
            )

        logger.info(
            "Resolved complaint classification",
            extra={
                "category_code": category.code,
                "department_code": department.code,
                "priority": priority.level.value,
                "confidence": signal.confidence,
            },
        )

        return ClassificationResult(
            category=category,
            department=department,
            entities=signal.entities,
            priority=priority,
            confidence=signal.confidence,
        )

    def _resolve_priority(
        self, category_code: str, llm_signals: list[str]
    ) -> PriorityAssessment:
        """Apply priority_rules.yaml rules in order (first match
        wins); fall back to the category's default priority.

        This is the deterministic, auditable decision point referenced
        in models/priority.py's docstring — the LLM only supplies
        `llm_signals` (e.g. "safety_hazard"); this method is what
        actually assigns the level.
        """
        rules = self._knowledge.get_priority_rules_for_category(category_code)

        for rule in rules:
            if rule.requires_llm_signal is None:
                return PriorityAssessment(
                    level=rule.level, reason=rule.reason, matched_rule_id=rule.id
                )
            if rule.requires_llm_signal in llm_signals:
                return PriorityAssessment(
                    level=rule.level, reason=rule.reason, matched_rule_id=rule.id
                )

        default_level = self._knowledge.get_default_priority(category_code)
        return PriorityAssessment(
            level=default_level,
            reason=f"No specific priority rule matched; using category default ({default_level.value}).",
            matched_rule_id=None,
        )
