"""
exceptions/validation.py

Exceptions for validation failures that occur outside of Pydantic's
own automatic validation (which raises pydantic.ValidationError at
the schema boundary). These cover business-rule validation performed
explicitly in services — e.g. "this complaint form is missing a
required document for its category" — where Pydantic alone can't
express the rule because it depends on data resolved at runtime
(knowledge lookups, cross-field rules).
"""

from __future__ import annotations

from typing import Any

from app.exceptions.base import AavedanSetuError


class ValidationFailedError(AavedanSetuError):
    """A business-rule validation check failed.

    Args:
        field: Name of the field/section that failed, for API error
            responses that point the citizen/frontend at what to fix.
        reason: Short machine-usable reason, e.g. "missing_document".
    """

    error_code = "VALIDATION_FAILED"

    def __init__(
        self,
        message: str,
        *,
        field: str | None = None,
        reason: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        details = details or {}
        if field is not None:
            details.setdefault("field", field)
        if reason is not None:
            details.setdefault("reason", reason)
        super().__init__(message, details=details)


class UnsupportedLanguageError(ValidationFailedError):
    """The requested/detected language is not one of the supported
    set (English, Hindi, Odia)."""

    error_code = "UNSUPPORTED_LANGUAGE"


class MissingRequiredFieldError(ValidationFailedError):
    """A required field was empty or absent after preprocessing."""

    error_code = "MISSING_REQUIRED_FIELD"
