"""
models/priority.py

Domain representation of a complaint's assessed priority. Priority is
NOT decided by the LLM alone: the LLM proposes a priority signal
(e.g. via keywords/severity language it detects), and
knowledge/priority_rules.yaml + business logic in
services/classification_service.py make the final determination.
This keeps priority assignment auditable and consistent, which
matters for a government system (citizens can reasonably ask "why was
my complaint marked low priority").
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import PriorityLevel


class PriorityAssessment(BaseModel):
    """Final priority decision for a complaint, with justification."""

    model_config = {"frozen": True}

    level: PriorityLevel
    reason: str = Field(
        description="Short human-readable explanation of why this "
        "priority was assigned, e.g. 'category=WATER_SUPPLY matched "
        "high-priority rule: no water supply > 24 hours'."
    )
    matched_rule_id: str | None = Field(
        default=None,
        description="ID of the priority rule from priority_rules.yaml "
        "that determined this level, if a rule matched (as opposed to "
        "falling back to the category default).",
    )
