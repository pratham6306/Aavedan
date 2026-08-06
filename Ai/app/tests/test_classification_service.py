"""tests/test_classification_service.py"""

from __future__ import annotations

from app.knowledge.knowledge_service import KnowledgeService
from app.models.entity import ExtractedEntities
from app.models.enums import PriorityLevel
from app.services.classification_service import (
    ClassificationService,
    LLMClassificationSignal,
)


def _signal(category_code: str, llm_signals: list[str] | None = None) -> LLMClassificationSignal:
    return LLMClassificationSignal(
        category_code=category_code,
        confidence=0.9,
        entities=ExtractedEntities(location="Rourkela"),
        llm_signals=llm_signals or [],
    )


def test_resolve_maps_category_to_default_department(
    knowledge_service: KnowledgeService,
) -> None:
    service = ClassificationService(knowledge_service)
    result = service.resolve(_signal("ROAD_DAMAGE"))
    assert result.category.code == "ROAD_DAMAGE"
    assert result.department.code == "PWD"


def test_public_safety_is_always_high_priority(knowledge_service: KnowledgeService) -> None:
    service = ClassificationService(knowledge_service)
    result = service.resolve(_signal("PUBLIC_SAFETY"))
    assert result.priority.level == PriorityLevel.HIGH
    assert result.priority.matched_rule_id == "PUBLIC_SAFETY_ALWAYS_HIGH"


def test_water_supply_escalates_to_critical_with_signal(
    knowledge_service: KnowledgeService,
) -> None:
    service = ClassificationService(knowledge_service)
    result = service.resolve(
        _signal("WATER_SUPPLY", llm_signals=["no_water_extended_outage"])
    )
    assert result.priority.level == PriorityLevel.CRITICAL


def test_water_supply_without_signal_uses_default_priority(
    knowledge_service: KnowledgeService,
) -> None:
    service = ClassificationService(knowledge_service)
    result = service.resolve(_signal("WATER_SUPPLY"))
    assert result.priority.level == PriorityLevel.MEDIUM
    assert result.priority.matched_rule_id is None


def test_entities_pass_through_unchanged(knowledge_service: KnowledgeService) -> None:
    service = ClassificationService(knowledge_service)
    result = service.resolve(_signal("ROAD_DAMAGE"))
    assert result.entities.location == "Rourkela"
