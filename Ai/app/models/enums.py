"""
models/enums.py

Shared enumerations used across domain models, schemas, and knowledge
data. Centralized here (rather than redefined per-file) so the set of
supported languages/priorities has exactly one definition.
"""

from __future__ import annotations

from enum import StrEnum


class Language(StrEnum):
    """Supported citizen-facing languages."""

    ENGLISH = "en"
    HINDI = "hi"
    ODIA = "or"


class PriorityLevel(StrEnum):
    """Complaint urgency, used for downstream routing/SLA rules."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ComplaintStatus(StrEnum):
    """Lifecycle status of a complaint as tracked by this AI module.

    Note: this is the AI service's view of processing status, not the
    full Django-backend complaint lifecycle (assigned/in-progress/
    resolved/closed), which is owned by the main backend.
    """

    RECEIVED = "received"
    PROCESSING = "processing"
    CLASSIFIED = "classified"
    VALIDATION_FAILED = "validation_failed"
    READY_FOR_SUBMISSION = "ready_for_submission"
