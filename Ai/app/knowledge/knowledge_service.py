"""
knowledge/knowledge_service.py

Single access point for all static reference data (categories,
departments, documents, priority rules). No other module should read
knowledge/*.yaml directly — everything goes through this service, so
there is exactly one place that knows the on-disk data format.

Loaded once at startup (or lazily on first access, cached thereafter)
and validated into typed models — a malformed YAML file fails loudly
via KnowledgeLoadError rather than causing confusing lookup failures
later.

Design note: kept as a class (KnowledgeService) rather than a bag of
module-level functions so it can be constructor-injected into
services (per the DI principle) and trivially swapped for a fake in
tests.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, ValidationError

from app.exceptions.knowledge import (
    KnowledgeLoadError,
    UnknownCategoryError,
    UnknownDepartmentError,
)
from app.models.category import Category
from app.models.department import Department
from app.models.enums import PriorityLevel

_DEFAULT_KNOWLEDGE_DIR = Path(__file__).parent


class _CategoriesFile(BaseModel):
    categories: list[Category]


class _DepartmentsFile(BaseModel):
    departments: list[Department]


class _DocumentType(BaseModel):
    code: str
    label: dict[str, str]


class _DocumentsFile(BaseModel):
    document_types: list[_DocumentType]
    category_required_documents: dict[str, list[str]]


class _PriorityRule(BaseModel):
    id: str
    category_codes: list[str]
    level: PriorityLevel
    reason: str
    requires_llm_signal: str | None = None


class _PriorityRulesFile(BaseModel):
    rules: list[_PriorityRule]
    category_default_priority: dict[str, PriorityLevel]


class KnowledgeService:
    """Loads and serves all static reference data used by the AI
    module.

    Args:
        knowledge_dir: Directory containing the *.yaml knowledge
            files. Defaults to this package's own directory. Exposed
            as a parameter so tests can point at a fixture directory
            with deliberately malformed data.
    """

    def __init__(self, knowledge_dir: Path | None = None) -> None:
        self._dir = knowledge_dir or _DEFAULT_KNOWLEDGE_DIR
        self._categories: dict[str, Category] = {}
        self._departments: dict[str, Department] = {}
        self._document_types: dict[str, _DocumentType] = {}
        self._category_required_documents: dict[str, list[str]] = {}
        self._priority_rules: list[_PriorityRule] = []
        self._category_default_priority: dict[str, PriorityLevel] = {}
        self._loaded = False

    # -- loading ----------------------------------------------------

    def load(self) -> None:
        """Load and validate all knowledge files. Idempotent — safe
        to call multiple times; only loads once.

        Raises:
            KnowledgeLoadError: if any file is missing, malformed, or
                fails schema validation.
        """
        if self._loaded:
            return

        categories_file = self._load_yaml("categories.yaml", _CategoriesFile)
        self._categories = {c.code: c for c in categories_file.categories}

        departments_file = self._load_yaml("departments.yaml", _DepartmentsFile)
        self._departments = {d.code: d for d in departments_file.departments}

        documents_file = self._load_yaml("documents.yaml", _DocumentsFile)
        self._document_types = {
            d.code: d for d in documents_file.document_types
        }
        self._category_required_documents = (
            documents_file.category_required_documents
        )

        priority_file = self._load_yaml(
            "priority_rules.yaml", _PriorityRulesFile
        )
        self._priority_rules = priority_file.rules
        self._category_default_priority = (
            priority_file.category_default_priority
        )

        self._validate_cross_references()
        self._loaded = True

    def _load_yaml(self, filename: str, schema: type[BaseModel]) -> Any:
        path = self._dir / filename
        if not path.exists():
            raise KnowledgeLoadError(
                f"Knowledge file not found: {path}",
                details={"file": filename},
            )
        try:
            raw = yaml.safe_load(path.read_text(encoding="utf-8"))
        except yaml.YAMLError as exc:
            raise KnowledgeLoadError(
                f"Failed to parse YAML in {filename}: {exc}",
                details={"file": filename},
            ) from exc

        try:
            return schema.model_validate(raw)
        except ValidationError as exc:
            raise KnowledgeLoadError(
                f"Schema validation failed for {filename}: {exc}",
                details={"file": filename},
            ) from exc

    def _validate_cross_references(self) -> None:
        """Sanity-check that categories/departments/documents/priority
        rules reference each other consistently, so an editing mistake
        in the YAML fails at startup instead of at request time.
        """
        category_codes = set(self._categories)
        department_codes = set(self._departments)

        for category in self._categories.values():
            if category.default_department_code not in department_codes:
                raise KnowledgeLoadError(
                    f"Category {category.code!r} references unknown "
                    f"department {category.default_department_code!r}",
                )

        for department in self._departments.values():
            unknown = set(department.handles_category_codes) - category_codes
            if unknown:
                raise KnowledgeLoadError(
                    f"Department {department.code!r} references unknown "
                    f"category codes: {unknown}",
                )

        unknown_doc_categories = (
            set(self._category_required_documents) - category_codes
        )
        if unknown_doc_categories:
            raise KnowledgeLoadError(
                f"documents.yaml references unknown category codes: "
                f"{unknown_doc_categories}"
            )

        unknown_priority_categories = (
            set(self._category_default_priority) - category_codes
        )
        if unknown_priority_categories:
            raise KnowledgeLoadError(
                f"priority_rules.yaml references unknown category codes: "
                f"{unknown_priority_categories}"
            )

    # -- accessors ----------------------------------------------------

    def get_category(self, code: str) -> Category:
        """Look up a category by its code.

        Raises:
            UnknownCategoryError: if `code` is not a known category.
        """
        self.load()
        try:
            return self._categories[code]
        except KeyError as exc:
            raise UnknownCategoryError(
                f"Unknown category code: {code!r}", details={"code": code}
            ) from exc

    def get_department(self, code: str) -> Department:
        """Look up a department by its code.

        Raises:
            UnknownDepartmentError: if `code` is not a known department.
        """
        self.load()
        try:
            return self._departments[code]
        except KeyError as exc:
            raise UnknownDepartmentError(
                f"Unknown department code: {code!r}", details={"code": code}
            ) from exc

    def get_all_categories(self) -> list[Category]:
        """Return all categories, e.g. for building the classification
        prompt's allowed-category list."""
        self.load()
        return list(self._categories.values())

    def get_required_documents(self, category_code: str) -> list[str]:
        """Return document type codes required for a given category."""
        self.load()
        return list(self._category_required_documents.get(category_code, []))

    def get_document_label(self, document_code: str, language: str) -> str:
        """Return the human-readable label for a document type in the
        given language, falling back to English."""
        self.load()
        doc_type = self._document_types.get(document_code)
        if doc_type is None:
            return document_code
        return doc_type.label.get(language, doc_type.label.get("en", document_code))

    def get_priority_rules_for_category(
        self, category_code: str
    ) -> list[_PriorityRule]:
        """Return priority rules applicable to a category, in the
        order they should be evaluated (first match wins)."""
        self.load()
        return [
            rule
            for rule in self._priority_rules
            if category_code in rule.category_codes
        ]

    def get_default_priority(self, category_code: str) -> PriorityLevel:
        """Return the fallback priority for a category when no
        specific rule matches."""
        self.load()
        return self._category_default_priority.get(
            category_code, PriorityLevel.LOW
        )


@lru_cache
def get_knowledge_service() -> KnowledgeService:
    """Return a process-wide cached KnowledgeService instance, loaded
    on first access. Used as a FastAPI dependency and for constructor
    injection into services.
    """
    service = KnowledgeService()
    service.load()
    return service
