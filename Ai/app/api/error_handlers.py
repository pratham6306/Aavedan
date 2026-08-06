"""
api/error_handlers.py

Maps AavedanSetuError subclasses to consistent JSON error responses
(schemas.common.ErrorResponse). Registered once on the FastAPI app in
main.py via `register_exception_handlers(app)`.

Centralizing this here means routers never need their own try/except
around service calls just to shape an error response — they let
AavedanSetuError subclasses propagate and this module handles them
uniformly.
"""

from __future__ import annotations

import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.logging import get_logger
from app.exceptions.base import AavedanSetuError
from app.exceptions.knowledge import KnowledgeError, UnknownCategoryError, UnknownDepartmentError
from app.exceptions.llm import LLMError, LLMInvalidJSONError, LLMProviderError, LLMTimeoutError
from app.exceptions.validation import ValidationFailedError
from app.schemas.common import ErrorResponse

logger = get_logger(__name__)

# Maps exception type -> HTTP status code. Checked via isinstance in
# most-specific-first order by relying on dict iteration order below
# matching the tuple ordering passed to _status_for.
_STATUS_MAP: list[tuple[type[AavedanSetuError], int]] = [
    (LLMTimeoutError, 504),
    (LLMInvalidJSONError, 502),
    (LLMProviderError, 502),
    (LLMError, 502),
    (UnknownCategoryError, 422),
    (UnknownDepartmentError, 422),
    (KnowledgeError, 500),
    (ValidationFailedError, 400),
    (AavedanSetuError, 500),
]


def _status_for(exc: AavedanSetuError) -> int:
    for exc_type, status_code in _STATUS_MAP:
        if isinstance(exc, exc_type):
            return status_code
    return 500


async def _handle_aavedan_setu_error(request: Request, exc: AavedanSetuError) -> JSONResponse:
    request_id = str(uuid.uuid4())
    status_code = _status_for(exc)

    logger.error(
        "Request failed with domain error",
        extra={
            "request_id": request_id,
            "error_code": exc.error_code,
            "path": request.url.path,
            "status_code": status_code,
        },
        exc_info=exc,
    )

    body = ErrorResponse(
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details,
        request_id=request_id,
    )
    return JSONResponse(status_code=status_code, content=body.model_dump())


def register_exception_handlers(app: FastAPI) -> None:
    """Register all domain exception handlers on the given FastAPI app.

    Called once from main.py at app construction time.
    """
    app.add_exception_handler(AavedanSetuError, _handle_aavedan_setu_error)
