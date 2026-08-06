"""tests/test_knowledge_service.py"""

from __future__ import annotations

from pathlib import Path

import pytest

from app.exceptions.knowledge import KnowledgeLoadError, UnknownCategoryError, UnknownDepartmentError
from app.knowledge.knowledge_service import KnowledgeService
from app.models.enums import PriorityLevel


def test_loads_real_knowledge_files_without_error(knowledge_service: KnowledgeService) -> None:
    categories = knowledge_service.get_all_categories()
    assert len(categories) > 0


def test_get_category_returns_known_category(knowledge_service: KnowledgeService) -> None:
    category = knowledge_service.get_category("ROAD_DAMAGE")
    assert category.code == "ROAD_DAMAGE"
    assert category.default_department_code == "PWD"


def test_get_category_unknown_code_raises(knowledge_service: KnowledgeService) -> None:
    with pytest.raises(UnknownCategoryError):
        knowledge_service.get_category("NOT_A_REAL_CATEGORY")


def test_get_department_unknown_code_raises(knowledge_service: KnowledgeService) -> None:
    with pytest.raises(UnknownDepartmentError):
        knowledge_service.get_department("NOT_A_REAL_DEPARTMENT")


def test_required_documents_for_water_supply(knowledge_service: KnowledgeService) -> None:
    docs = knowledge_service.get_required_documents("WATER_SUPPLY")
    assert "PHOTO_EVIDENCE" in docs
    assert "ADDRESS_PROOF" in docs


def test_public_safety_always_high_priority(knowledge_service: KnowledgeService) -> None:
    rules = knowledge_service.get_priority_rules_for_category("PUBLIC_SAFETY")
    assert any(r.level == PriorityLevel.HIGH and r.requires_llm_signal is None for r in rules)


def test_default_priority_fallback(knowledge_service: KnowledgeService) -> None:
    assert knowledge_service.get_default_priority("GARBAGE_COLLECTION") == PriorityLevel.LOW


def test_document_label_falls_back_to_english(knowledge_service: KnowledgeService) -> None:
    label = knowledge_service.get_document_label("PHOTO_EVIDENCE", "fr")  # unsupported lang
    assert label == "Photo evidence of the issue"


def test_malformed_department_reference_fails_at_load(tmp_path: Path) -> None:
    """A category pointing at a non-existent department must fail
    loudly at load time (cross-reference validation), not silently
    pass through to a runtime KeyError later."""
    (tmp_path / "categories.yaml").write_text(
        """
categories:
  - code: TEST_CAT
    default_department_code: GHOST_DEPT
    display_name:
      en: "Test"
    description: null
"""
    )
    (tmp_path / "departments.yaml").write_text("departments: []\n")
    (tmp_path / "documents.yaml").write_text(
        "document_types: []\ncategory_required_documents: {}\n"
    )
    (tmp_path / "priority_rules.yaml").write_text(
        "rules: []\ncategory_default_priority: {}\n"
    )

    service = KnowledgeService(knowledge_dir=tmp_path)
    with pytest.raises(KnowledgeLoadError):
        service.load()


def test_missing_file_raises_knowledge_load_error(tmp_path: Path) -> None:
    service = KnowledgeService(knowledge_dir=tmp_path)
    with pytest.raises(KnowledgeLoadError):
        service.load()
