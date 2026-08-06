"""
models/entity.py

Domain representation of entities extracted from citizen complaint
text by the LLM (location, landmark, issue type, dates mentioned).

This is deliberately a plain domain object, not the LLM's raw output
shape — llm/response_parser.py is responsible for mapping the raw
Gemini JSON into this model. Downstream services (form_service,
draft_service) work against this stable shape regardless of how the
LLM happened to phrase its output.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ExtractedEntities(BaseModel):
    """Structured entities pulled from free-text complaint input.

    All fields are optional since a given complaint may not mention
    every entity type — absence is meaningful and should NOT be
    coerced into empty strings by callers.
    """

    model_config = {"frozen": True}

    location: str | None = Field(
        default=None, description="City/town/ward mentioned, if any."
    )
    landmark: str | None = Field(
        default=None, description="Nearby landmark mentioned, if any."
    )
    issue_type: str | None = Field(
        default=None,
        description="Free-text issue description, e.g. 'pothole', 'streetlight not working'.",
    )
    dates_mentioned: list[str] = Field(
        default_factory=list,
        description="Any dates/timeframes mentioned in the complaint, as raw text.",
    )
    other_entities: dict[str, str] = Field(
        default_factory=dict,
        description="Catch-all for additional named entities the LLM identifies "
        "that don't fit the fixed fields above.",
    )
