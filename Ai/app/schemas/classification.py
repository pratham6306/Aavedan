"""
schemas/classification.py

Request/response contracts for POST /api/v1/complaints/classify.

These schemas are deliberately thinner than the internal
models.Complaint object — they expose only what the frontend/Django
backend needs, and use plain strings/codes rather than nested domain
objects with frozen config, keeping the API contract stable even if
internal domain models change shape.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import Language, PriorityLevel


class ClassifyComplaintRequest(BaseModel):
    """Request body for classifying a citizen complaint."""

    text: str = Field(
        min_length=1,
        max_length=5000,
        description="Raw complaint text as submitted by the citizen.",
    )
    language: Language | None = Field(
        default=None,
        description="Language selected by the citizen in the UI, if known. "
        "If omitted, the service will auto-detect it.",
    )
    image_base64: str | None = Field(
        default=None,
        description="Base64 encoded image content for vision analysis.",
    )


class EntitiesResponse(BaseModel):
    """Entities extracted from the complaint text."""

    location: str | None = None
    landmark: str | None = None
    issue_type: str | None = None
    dates_mentioned: list[str] = Field(default_factory=list)


class ClassifyComplaintResponse(BaseModel):
    """Result of classifying and analyzing a citizen complaint."""

    complaint_id: str = Field(
        description="Correlation ID for this AI-processing run (not a DB ID)."
    )
    detected_language: Language
    category_code: str
    category_display_name: str
    department_code: str
    department_name: str
    priority: PriorityLevel
    priority_reason: str
    entities: EntitiesResponse
    suggested_documents: list[str] = Field(default_factory=list)
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Model confidence in the category prediction, "
        "as self-reported by the LLM classification step.",
    )


class DetectIntentRequest(BaseModel):
    """Request body for detecting user intent and language."""
    text: str = Field(
        min_length=1,
        max_length=5000,
        description="Raw user message.",
    )


class DetectIntentResponse(BaseModel):
    """Result of intent and language detection."""
    intent: str
    language: str
