"""
api/router.py

Aggregates all sub-routers into a single top-level router, mounted
once in main.py. Adding a new feature area means adding one router
module in api/routers/ and one `include_router` line here — main.py
itself never needs to change.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.routers import complaint, health, translation, schemes

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(complaint.router)
api_router.include_router(translation.router)
api_router.include_router(schemes.router)
