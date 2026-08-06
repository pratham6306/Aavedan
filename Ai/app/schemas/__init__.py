"""
schemas/

Pydantic models defining the external API contract (request/response
bodies). Distinct from models/, which holds internal domain objects.
API routes in api/ should only ever accept/return types from this
package.
"""

from app.schemas.classification import (
    ClassifyComplaintRequest,
    ClassifyComplaintResponse,
    EntitiesResponse,
)
from app.schemas.common import ErrorResponse, HealthResponse
from app.schemas.draft import GenerateDraftRequest, GenerateDraftResponse
from app.schemas.form import (
    ComplaintFormData,
    FormValidationIssue,
    ValidateFormResponse,
)
from app.schemas.translation import TranslateRequest, TranslateResponse

__all__ = [
    "ClassifyComplaintRequest",
    "ClassifyComplaintResponse",
    "EntitiesResponse",
    "ErrorResponse",
    "HealthResponse",
    "GenerateDraftRequest",
    "GenerateDraftResponse",
    "ComplaintFormData",
    "FormValidationIssue",
    "ValidateFormResponse",
    "TranslateRequest",
    "TranslateResponse",
]
