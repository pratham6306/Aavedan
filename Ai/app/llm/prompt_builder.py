"""
llm/prompt_builder.py

Renders prompt templates (loaded via PromptLoader) by injecting
runtime variables: complaint text, language, category list, etc.

Uses a minimal `{{ variable_name }}` substitution rather than pulling
in a full templating engine (Jinja2) — the prompts here are simple
enough that a regex-based substitution keeps the dependency surface
small. If prompts grow to need loops/conditionals, swapping this
implementation for Jinja2 is a contained change: only this file and
its tests would need to change, since callers only see
`PromptBuilder.build(...)`.
"""

from __future__ import annotations

import re
from typing import Any

from app.exceptions.llm import PromptRenderError
from app.llm.prompt_loader import PromptLoader
from app.models.category import Category

_VARIABLE_PATTERN = re.compile(r"\{\{\s*(\w+)\s*\}\}")


class PromptBuilder:
    """Builds final prompt strings from templates + runtime context.

    Args:
        loader: PromptLoader instance to source raw template text
            from. Injected rather than constructed internally, so
            tests can supply a loader backed by fixture templates.
    """

    def __init__(self, loader: PromptLoader) -> None:
        self._loader = loader

    def build(self, template_name: str, **variables: Any) -> str:
        """Render a named template with the given variables.

        Args:
            template_name: Filename within prompts/, e.g.
                "classification.txt".
            **variables: Values to substitute for each `{{ name }}`
                placeholder in the template. Non-string values are
                converted with `str()`.

        Raises:
            PromptRenderError: if the template references a variable
                that was not supplied, to fail loudly rather than
                silently sending a malformed prompt to the LLM.
        """
        template = self._loader.load(template_name)

        required_vars = set(_VARIABLE_PATTERN.findall(template))
        missing = required_vars - set(variables.keys())
        if missing:
            raise PromptRenderError(
                f"Missing variables for template {template_name!r}: {sorted(missing)}",
                details={"template": template_name, "missing_variables": sorted(missing)},
            )

        def _substitute(match: re.Match[str]) -> str:
            key = match.group(1)
            return str(variables[key])

        return _VARIABLE_PATTERN.sub(_substitute, template)

    @staticmethod
    def format_category_list(categories: list[Category], language: str) -> str:
        """Format the allowed-categories list for injection into the
        classification prompt, as "- CODE: display name" lines.

        Kept as a static helper here (rather than in the service
        layer) since it's purely about shaping data for a prompt,
        which is this module's responsibility.
        """
        lines = []
        for category in categories:
            display = category.display_name.get(
                language, category.display_name.get("en", category.code)
            )
            lines.append(f"- {category.code}: {display}")
        return "\n".join(lines)
