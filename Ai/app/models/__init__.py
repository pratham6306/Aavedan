"""
models/

Domain objects: the internal representation of a complaint and its
related concepts (category, department, entities, priority), as
distinct from schemas/ (API request/response contracts).

Rule of thumb: if a shape needs an HTTP status code, request-id, or
pagination envelope, it belongs in schemas/, not here.
"""

from app.models.category import Category
from app.models.complaint import Complaint, ComplaintInput
from app.models.department import Department
from app.models.entity import ExtractedEntities
from app.models.enums import ComplaintStatus, Language, PriorityLevel
from app.models.priority import PriorityAssessment

__all__ = [
    "Category",
    "Department",
    "ExtractedEntities",
    "PriorityAssessment",
    "Complaint",
    "ComplaintInput",
    "Language",
    "PriorityLevel",
    "ComplaintStatus",
]
