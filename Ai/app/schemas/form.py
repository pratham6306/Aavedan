"""
schemas/form.py

Request/response contracts for POST /api/v1/complaints/validate-form.

Form validation is pure business logic (services/form_service.py) —
the LLM is NOT involved in this endpoint at all, per the project rule
that the LLM must never "perform validation rules". This schema
module exists to define that contract clearly.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ComplaintFormData(BaseModel):
    """Citizen-submitted complaint form fields to validate."""

    category_code: str
    department_code: str
    description: str = Field(min_length=1, max_length=5000)
    location: str | None = None
    attached_document_types: list[str] = Field(
        default_factory=list,
        description="Document type codes the citizen has attached, "
        "e.g. ['ID_PROOF', 'PHOTO_EVIDENCE'].",
    )


class FormValidationIssue(BaseModel):
    """A single validation problem found in a submitted form."""

    field: str
    reason: str
    message: str


class ValidateFormResponse(BaseModel):
    """Result of validating a complaint form before submission."""

    is_valid: bool
    issues: list[FormValidationIssue] = Field(default_factory=list)
    missing_documents: list[str] = Field(default_factory=list)
