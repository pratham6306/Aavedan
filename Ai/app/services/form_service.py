"""
services/form_service.py

Validates a citizen-submitted complaint form against business rules:
category/department consistency, required fields, and required
documents for the category. Deliberately has NO dependency on
llm/ — form validation is pure backend business logic, per the
project rule that the LLM must never "perform validation rules".
"""

from __future__ import annotations

from app.core.logging import get_logger
from app.exceptions.knowledge import UnknownCategoryError, UnknownDepartmentError
from app.knowledge.knowledge_service import KnowledgeService
from app.schemas.form import ComplaintFormData, FormValidationIssue

logger = get_logger(__name__)


class FormService:
    """Validates complaint form submissions.

    Args:
        knowledge_service: Source of category/department/document
            reference data used for validation rules.
    """

    def __init__(self, knowledge_service: KnowledgeService) -> None:
        self._knowledge = knowledge_service

    def validate(
        self, form: ComplaintFormData
    ) -> tuple[list[FormValidationIssue], list[str]]:
        """Validate a submitted complaint form.

        Returns:
            A tuple of (issues, missing_documents). An empty `issues`
            list means the form passed all checks other than possibly
            missing optional documents.
        """
        issues: list[FormValidationIssue] = []

        category = self._safe_get_category(form.category_code, issues)
        department = self._safe_get_department(form.department_code, issues)

        if category is not None and department is not None:
            if category.code not in department.handles_category_codes:
                issues.append(
                    FormValidationIssue(
                        field="department_code",
                        reason="category_department_mismatch",
                        message=(
                            f"Department {department.code!r} does not handle "
                            f"category {category.code!r}."
                        ),
                    )
                )

        if not form.description.strip():
            issues.append(
                FormValidationIssue(
                    field="description",
                    reason="empty_description",
                    message="Complaint description cannot be empty.",
                )
            )

        missing_documents: list[str] = []
        if category is not None:
            required = self._knowledge.get_required_documents(category.code)
            missing_documents = [
                doc
                for doc in required
                if doc not in form.attached_document_types
            ]
            if missing_documents:
                issues.append(
                    FormValidationIssue(
                        field="attached_document_types",
                        reason="missing_required_documents",
                        message=(
                            "The following required documents are missing: "
                            f"{', '.join(missing_documents)}."
                        ),
                    )
                )

        logger.info(
            "Validated complaint form",
            extra={
                "category_code": form.category_code,
                "issue_count": len(issues),
                "missing_document_count": len(missing_documents),
            },
        )

        return issues, missing_documents

    def _safe_get_category(self, code: str, issues: list[FormValidationIssue]):
        try:
            return self._knowledge.get_category(code)
        except UnknownCategoryError:
            issues.append(
                FormValidationIssue(
                    field="category_code",
                    reason="unknown_category",
                    message=f"Unknown category code: {code!r}.",
                )
            )
            return None

    def _safe_get_department(self, code: str, issues: list[FormValidationIssue]):
        try:
            return self._knowledge.get_department(code)
        except UnknownDepartmentError:
            issues.append(
                FormValidationIssue(
                    field="department_code",
                    reason="unknown_department",
                    message=f"Unknown department code: {code!r}.",
                )
            )
            return None
