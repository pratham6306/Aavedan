"""
exceptions/

Typed exception hierarchy for the application, rooted at
AavedanSetuError. Grouped by the layer that raises them:

    base.py        - AavedanSetuError (root)
    llm.py         - LLM call / parsing failures
    validation.py  - business-rule validation failures
    knowledge.py   - reference-data lookup failures

Re-exported here so call sites can do:
    from app.exceptions import LLMInvalidJSONError
instead of reaching into the submodule.
"""

from app.exceptions.base import AavedanSetuError
from app.exceptions.knowledge import (
    KnowledgeError,
    KnowledgeLoadError,
    UnknownCategoryError,
    UnknownDepartmentError,
)
from app.exceptions.llm import (
    LLMError,
    LLMInvalidJSONError,
    LLMProviderError,
    LLMTimeoutError,
    PromptRenderError,
)
from app.exceptions.validation import (
    MissingRequiredFieldError,
    UnsupportedLanguageError,
    ValidationFailedError,
)

__all__ = [
    "AavedanSetuError",
    "LLMError",
    "LLMProviderError",
    "LLMTimeoutError",
    "LLMInvalidJSONError",
    "PromptRenderError",
    "ValidationFailedError",
    "UnsupportedLanguageError",
    "MissingRequiredFieldError",
    "KnowledgeError",
    "KnowledgeLoadError",
    "UnknownCategoryError",
    "UnknownDepartmentError",
]
