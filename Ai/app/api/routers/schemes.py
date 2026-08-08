"""
api/routers/schemes.py

Endpoints for government scheme recommendations and eligibility checks.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_ai_orchestrator
from app.schemas.schemes import RecommendSchemesRequest, RecommendSchemesResponse, SchemeRecommendationResponse
from app.services.ai_orchestrator import AIOrchestrator

router = APIRouter(prefix="/api/v1/schemes", tags=["schemes"])


@router.post("/recommend", response_model=RecommendSchemesResponse)
async def recommend_schemes(
    request: RecommendSchemesRequest,
    orchestrator: AIOrchestrator = Depends(get_ai_orchestrator),
) -> RecommendSchemesResponse:
    """Recommend government schemes matching user circumstances."""
    signal = await orchestrator.recommend_schemes(
        user_description=request.user_description,
        schemes=request.schemes,
    )
    
    recommendations = []
    for rec in signal.recommendations:
        recommendations.append(
            SchemeRecommendationResponse(
                scheme_id=rec.scheme_id,
                scheme_name=rec.scheme_name,
                is_eligible=rec.is_eligible,
                matching_reason=rec.matching_reason,
                required_documents=rec.required_documents,
                filling_instructions=rec.filling_instructions,
            )
        )
        
    return RecommendSchemesResponse(recommendations=recommendations)
