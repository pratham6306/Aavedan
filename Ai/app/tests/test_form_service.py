"""tests/test_form_service.py"""

from __future__ import annotations

from app.knowledge.knowledge_service import KnowledgeService
from app.schemas.form import ComplaintFormData
from app.services.form_service import FormService


def test_valid_form_with_all_documents_passes(knowledge_service: KnowledgeService) -> None:
    service = FormService(knowledge_service)
    form = ComplaintFormData(
        category_code="ROAD_DAMAGE",
        department_code="PWD",
        description="Large pothole on main road.",
        attached_document_types=["PHOTO_EVIDENCE"],
    )
    issues, missing = service.validate(form)
    assert issues == []
    assert missing == []


def test_mismatched_category_department_flagged(knowledge_service: KnowledgeService) -> None:
    service = FormService(knowledge_service)
    form = ComplaintFormData(
        category_code="ROAD_DAMAGE",
        department_code="WATER_BOARD",  # wrong department for this category
        description="Large pothole.",
        attached_document_types=["PHOTO_EVIDENCE"],
    )
    issues, _ = service.validate(form)
    assert any(i.reason == "category_department_mismatch" for i in issues)


def test_missing_required_document_flagged(knowledge_service: KnowledgeService) -> None:
    service = FormService(knowledge_service)
    form = ComplaintFormData(
        category_code="WATER_SUPPLY",
        department_code="WATER_BOARD",
        description="No water for two days.",
        attached_document_types=[],  # missing PHOTO_EVIDENCE + ADDRESS_PROOF
    )
    issues, missing = service.validate(form)
    assert "PHOTO_EVIDENCE" in missing
    assert "ADDRESS_PROOF" in missing
    assert any(i.reason == "missing_required_documents" for i in issues)


def test_unknown_category_code_flagged_not_raised(knowledge_service: KnowledgeService) -> None:
    """Form validation must translate lookup failures into
    FormValidationIssue entries, not let exceptions propagate to the
    API layer as a 500."""
    service = FormService(knowledge_service)
    form = ComplaintFormData(
        category_code="NOT_REAL",
        department_code="PWD",
        description="Something.",
    )
    issues, _ = service.validate(form)
    assert any(i.reason == "unknown_category" for i in issues)
