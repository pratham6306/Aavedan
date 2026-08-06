"""
models/department.py

Domain representation of a responsible government department.
Produced exclusively by knowledge/knowledge_service.py from
knowledge/departments.yaml.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class Department(BaseModel):
    """A government department that complaints can be routed to.

    Attributes:
        code: Stable identifier, e.g. "PWD", "MUNICIPAL_CORP".
        name: Human-readable name per supported language.
        handles_category_codes: Categories this department is
            responsible for — used by knowledge_service to validate
            that an LLM-predicted (category, department) pair is
            actually a sane combination, not just two independently
            valid codes.

    Explicitly does NOT include an email address or contact endpoint
    here as a field the LLM ever generates or sees — per the project
    rules, the LLM must never generate contact/routing details itself.
    Any such contact info the backend needs lives in the Django
    backend's own department records, not in this AI module.
    """

    model_config = {"frozen": True}

    code: str
    name: dict[str, str] = Field(
        description="Mapping of language code (en/hi/or) to display name."
    )
    handles_category_codes: list[str] = Field(default_factory=list)
