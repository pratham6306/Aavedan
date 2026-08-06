"""
schemas/draft.py

Request/response contracts for POST /api/v1/complaints/draft.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import Language


class GenerateDraftRequest(BaseModel):
    """Request to turn raw complaint text into a professional draft."""

    text: str = Field(min_length=1, max_length=5000)
    language: Language | None = Field(
        default=None,
        description="Target language for the draft. Defaults to the "
        "detected language of `text` if omitted.",
    )
    category_code: str | None = Field(
        default=None,
        description="Optional known category code, if classification "
        "already ran, to steer draft tone/structure. If omitted, the "
        "draft service will classify internally.",
    )


class GenerateDraftResponse(BaseModel):
    """A generated, citizen-reviewable complaint draft."""

    complaint_id: str
    draft_text: str = Field(description="Polished, formal complaint draft.")
    language: Language
    suggested_documents: list[str] = Field(default_factory=list)
