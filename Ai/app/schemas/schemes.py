"""
schemas/schemes.py

Request/response schemas for government scheme recommendations.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class SchemeInputSchema(BaseModel):
    """Scheme data from the Django database, passed to the AI microservice."""

    id: int
    scheme_name: str
    description: str
    benefits: str
    eligibility: str
    keywords: str = ""
    required_documents: list[str] = Field(default_factory=list)


class RecommendSchemesRequest(BaseModel):
    """Request contract for scheme recommendations."""

    user_description: str = Field(
        ...,
        description="Natural language explanation of the user's details, e.g., 'I am a 20yo student from Bihar, family income 1.5L'."
    )
    schemes: list[SchemeInputSchema] = Field(
        ...,
        description="List of available schemes to evaluate eligibility against."
    )


class SchemeRecommendationResponse(BaseModel):
    """AI eligibility assessment for a single scheme."""

    scheme_id: int
    scheme_name: str
    is_eligible: bool = Field(description="Whether the user is likely eligible based on eligibility text.")
    matching_reason: str = Field(description="Explanation of eligibility matching or mismatch reasons.")
    required_documents: list[str] = Field(default_factory=list, description="Documents required for application.")
    filling_instructions: str = Field(description="Step-by-step instructions guiding the user on how to fill/apply.")


class RecommendSchemesResponse(BaseModel):
    """Aggregate response containing all scheme recommendations."""

    recommendations: list[SchemeRecommendationResponse]
