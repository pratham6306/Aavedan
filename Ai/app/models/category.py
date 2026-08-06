"""
models/category.py

Domain representation of a complaint category. Instances are produced
by knowledge/knowledge_service.py from knowledge/categories.yaml —
never constructed ad hoc by services, so the set of valid categories
has one source of truth.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class Category(BaseModel):
    """A predefined complaint category.

    Attributes:
        code: Stable machine-readable identifier, e.g. "ROAD_DAMAGE".
            This is what the LLM is prompted to choose from and what
            gets stored/routed on — never the display name.
        display_name: Human-readable name shown to citizens, per
            supported language.
        default_department_code: Department this category routes to
            by default; individual entities may override in
            departments.yaml mappings if a location-specific rule
            applies (handled by knowledge_service, not here).
    """

    model_config = {"frozen": True}

    code: str
    display_name: dict[str, str] = Field(
        description="Mapping of language code (en/hi/or) to display name."
    )
    default_department_code: str
    description: str | None = None
