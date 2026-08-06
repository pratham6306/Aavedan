"""
knowledge/

Static reference data (categories, departments, documents, priority
rules) stored as human-editable YAML and served exclusively through
knowledge_service.py. No other module reads these YAML files directly.
"""

from app.knowledge.knowledge_service import KnowledgeService, get_knowledge_service

__all__ = ["KnowledgeService", "get_knowledge_service"]
