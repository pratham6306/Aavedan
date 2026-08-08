"""
api/routers/complaint.py

Endpoints for complaint classification, draft generation, and form
validation. Routes are intentionally thin: parse/validate the request
(FastAPI + Pydantic already do this), delegate to the orchestrator or
form_service, map the result onto the response schema. No business
logic lives here — see services/ for that.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_ai_orchestrator, get_form_service
from app.schemas.classification import (
    ClassifyComplaintRequest,
    ClassifyComplaintResponse,
    EntitiesResponse,
)
from app.schemas.draft import GenerateDraftRequest, GenerateDraftResponse
from app.schemas.form import ComplaintFormData, ValidateFormResponse
from app.services.ai_orchestrator import AIOrchestrator
from app.services.form_service import FormService

router = APIRouter(prefix="/api/v1/complaints", tags=["complaints"])


@router.post("/classify", response_model=ClassifyComplaintResponse)
async def classify_complaint(
    request: ClassifyComplaintRequest,
    orchestrator: AIOrchestrator = Depends(get_ai_orchestrator),
) -> ClassifyComplaintResponse:
    """Classify a citizen complaint: category, department, priority,
    and extracted entities."""
    complaint = await orchestrator.classify_complaint(
        raw_text=request.text,
        declared_language=request.language,
        image_base64=request.image_base64,
    )

    assert complaint.category is not None
    assert complaint.department is not None
    assert complaint.priority is not None
    assert complaint.entities is not None
    assert complaint.classification_confidence is not None

    language = complaint.detected_language.value
    return ClassifyComplaintResponse(
        complaint_id=str(complaint.id),
        detected_language=complaint.detected_language,
        category_code=complaint.category.code,
        category_display_name=complaint.category.display_name.get(
            language, complaint.category.display_name.get("en", complaint.category.code)
        ),
        department_code=complaint.department.code,
        department_name=complaint.department.name.get(
            language, complaint.department.name.get("en", complaint.department.code)
        ),
        priority=complaint.priority.level,
        priority_reason=complaint.priority.reason,
        entities=EntitiesResponse(
            location=complaint.entities.location,
            landmark=complaint.entities.landmark,
            issue_type=complaint.entities.issue_type,
            dates_mentioned=complaint.entities.dates_mentioned,
        ),
        suggested_documents=complaint.suggested_documents,
        confidence=complaint.classification_confidence,
    )


@router.post("/draft", response_model=GenerateDraftResponse)
async def generate_draft(
    request: GenerateDraftRequest,
    orchestrator: AIOrchestrator = Depends(get_ai_orchestrator),
) -> GenerateDraftResponse:
    """Generate a professional complaint draft from raw citizen text."""
    complaint_id, draft_text, suggested_documents, language_used = (
        await orchestrator.generate_draft(
            raw_text=request.text,
            language=request.language,
            category_code=request.category_code,
        )
    )
    return GenerateDraftResponse(
        complaint_id=complaint_id,
        draft_text=draft_text,
        language=language_used,
        suggested_documents=suggested_documents,
    )


@router.post("/validate-form", response_model=ValidateFormResponse)
async def validate_form(
    form: ComplaintFormData,
    form_service: FormService = Depends(get_form_service),
) -> ValidateFormResponse:
    """Validate a complaint form before submission. Pure business
    rules — no LLM call is made for this endpoint."""
    issues, missing_documents = form_service.validate(form)
    return ValidateFormResponse(
        is_valid=len(issues) == 0,
        issues=issues,
        missing_documents=missing_documents,
    )
