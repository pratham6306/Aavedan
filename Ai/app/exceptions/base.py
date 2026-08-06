"""
exceptions/base.py

Base exception hierarchy for the application.

All custom exceptions inherit from `AavedanSetuError`, so API-layer
exception handlers can catch that one base class and still recover the
specific type for logging/response-mapping via `isinstance` checks or
a registry keyed on `error_code`.

Each exception carries an `error_code` (stable, machine-readable string
used in API error responses — see schemas/common.py) and a `details`
dict for structured context (e.g. which field failed validation),
kept separate from the human-readable message.
"""

from __future__ import annotations

from typing import Any


class AavedanSetuError(Exception):
    """Root exception for all application-specific errors.

    Args:
        message: Human-readable error description (safe to log; should
            NOT default to including raw citizen complaint text).
        error_code: Stable machine-readable identifier, e.g.
            "LLM_INVALID_JSON". Used by the API layer to map exceptions
            to consistent error response bodies without string-matching
            on `message`.
        details: Optional structured context for debugging/logging.
    """

    error_code: str = "INTERNAL_ERROR"

    def __init__(
        self,
        message: str,
        *,
        error_code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.error_code = error_code or self.error_code
        self.details = details or {}

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(error_code={self.error_code!r}, message={self.message!r})"
