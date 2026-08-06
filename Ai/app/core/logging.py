"""
core/logging.py

Centralized logging configuration.

Design:
    - Environment-aware format: plain, human-readable text in `local`
      (fast to read during hackathon dev), structured JSON everywhere
      else (`development`, `staging`, `production`) so logs are
      machine-parseable by aggregators (CloudWatch, ELK, etc.) — this
      matters for a system that will eventually run in a government
      production environment with audit requirements.
    - Configured ONCE at process startup via `configure_logging()`,
      called from `main.py` before the FastAPI app is constructed.
      Every other module just does `logger = get_logger(__name__)`
      and logs normally — no module configures logging itself.
    - No secrets or PII in log records. Callers are responsible for
      not logging raw complaint text with identifying info at INFO
      level in production; this module provides a `redact()` helper
      for the common case (truncating/hashing long free-text fields)
      so callers have an easy, consistent way to comply.
    - Uses stdlib `logging` only — no extra dependency — since Gemini
      SDK and FastAPI/uvicorn already configure stdlib loggers, and
      piggybacking on the same system avoids duplicate/conflicting
      log pipelines.
"""

from __future__ import annotations

import hashlib
import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any

from app.core.config import Settings, get_settings


class JSONFormatter(logging.Formatter):
    """Formats log records as single-line JSON.

    Chosen over a third-party lib (e.g. python-json-logger) to avoid
    an extra dependency for what is a small, well-understood format.
    """

    # Standard LogRecord attributes we don't want duplicated inside
    # the "extra" fields of the JSON payload.
    _RESERVED = {
        "name", "msg", "args", "levelname", "levelno", "pathname",
        "filename", "module", "exc_info", "exc_text", "stack_info",
        "lineno", "funcName", "created", "msecs", "relativeCreated",
        "thread", "threadName", "processName", "process", "message",
        "taskName",
    }

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(
                record.created, tz=timezone.utc
            ).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Include any structured extras passed via `logger.info(msg, extra={...})`
        for key, value in record.__dict__.items():
            if key not in self._RESERVED and not key.startswith("_"):
                payload[key] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str)


class PlainFormatter(logging.Formatter):
    """Human-readable formatter for local development."""

    def __init__(self) -> None:
        super().__init__(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%H:%M:%S",
        )


def configure_logging(settings: Settings | None = None) -> None:
    """Configure the root logger for the process.

    Must be called exactly once, at application startup (from
    `main.py`), before any request is served. Idempotent: calling it
    again replaces existing handlers rather than stacking duplicates,
    which matters for test suites that may import the app multiple
    times.

    Args:
        settings: Optional pre-resolved Settings instance. Defaults to
            `get_settings()`. Accepting it as a parameter (rather than
            always calling `get_settings()` internally) keeps this
            function easy to unit test with arbitrary settings.
    """
    settings = settings or get_settings()

    root_logger = logging.getLogger()
    root_logger.setLevel(settings.app.log_level)

    # Remove any pre-existing handlers to keep this idempotent.
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    handler = logging.StreamHandler(stream=sys.stdout)
    if settings.app.environment == "local":
        handler.setFormatter(PlainFormatter())
    else:
        handler.setFormatter(JSONFormatter())

    root_logger.addHandler(handler)

    # Quiet down noisy third-party loggers unless we're debugging.
    if not settings.app.debug:
        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a named logger.

    Thin wrapper over `logging.getLogger` kept as the single import
    point (`from app.core.logging import get_logger`) so call sites
    don't reach into the stdlib `logging` module directly, and so this
    is the one place we'd change if we ever swapped logging backends.
    """
    return logging.getLogger(name)


def redact(value: str, *, max_length: int = 80) -> str:
    """Truncate long free-text values for safe logging.

    Intended for citizen-submitted complaint text, which may contain
    personal information (names, addresses, phone numbers) and should
    not be logged verbatim at INFO level in non-local environments.
    Returns the truncated text plus a short hash of the full value so
    log entries remain correlatable across a request without exposing
    the raw content.

    Args:
        value: The raw text to redact.
        max_length: Maximum number of characters to keep from the
            start of `value` before truncating.

    Returns:
        A redacted string safe to pass to a logger.
    """
    if len(value) <= max_length:
        return value

    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:8]
    return f"{value[:max_length]}... [truncated, sha256:{digest}]"
