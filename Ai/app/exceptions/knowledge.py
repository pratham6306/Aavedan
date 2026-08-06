"""
exceptions/knowledge.py

Exceptions raised by knowledge/knowledge_service.py when static
reference data (categories, departments, forms, documents, priority
rules) is missing, malformed, or an unknown key is looked up.
"""

from __future__ import annotations

from app.exceptions.base import AavedanSetuError


class KnowledgeError(AavedanSetuError):
    """Base class for knowledge-layer failures."""

    error_code = "KNOWLEDGE_ERROR"


class KnowledgeLoadError(KnowledgeError):
    """A knowledge data file failed to load or failed schema
    validation at startup. This should surface loudly at boot time —
    a malformed departments.yaml must not fail silently."""

    error_code = "KNOWLEDGE_LOAD_ERROR"


class UnknownCategoryError(KnowledgeError):
    """Lookup requested a category code that doesn't exist in the
    knowledge base. Typically indicates the LLM predicted a category
    outside the allowed set — the orchestrator should treat this as
    a signal to retry with a corrective prompt, not a hard failure."""

    error_code = "UNKNOWN_CATEGORY"


class UnknownDepartmentError(KnowledgeError):
    """Lookup requested a department code that doesn't exist in the
    knowledge base."""

    error_code = "UNKNOWN_DEPARTMENT"
