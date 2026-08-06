"""
llm/prompt_loader.py

Responsible ONLY for reading prompt template files off disk. Contains
no templating/injection logic — that's prompt_builder.py's job. This
split means prompt_builder can be unit-tested with in-memory template
strings without touching the filesystem, and prompt_loader can be
unit-tested for file-not-found/encoding issues without needing to
know anything about template syntax.

Templates are cached in memory after first read (they don't change at
runtime), with an explicit `reload()` for local dev iteration.
"""

from __future__ import annotations

from pathlib import Path

from app.exceptions.llm import PromptRenderError

_DEFAULT_PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


class PromptLoader:
    """Loads raw prompt template text from the prompts/ directory."""

    def __init__(self, prompts_dir: Path | None = None) -> None:
        self._dir = prompts_dir or _DEFAULT_PROMPTS_DIR
        self._cache: dict[str, str] = {}

    def load(self, template_name: str) -> str:
        """Return the raw contents of a prompt template file.

        Args:
            template_name: Filename within prompts/, e.g.
                "classification.txt".

        Raises:
            PromptRenderError: if the template file does not exist.
        """
        if template_name in self._cache:
            return self._cache[template_name]

        path = self._dir / template_name
        if not path.exists():
            raise PromptRenderError(
                f"Prompt template not found: {template_name}",
                details={"template": template_name, "path": str(path)},
            )

        content = path.read_text(encoding="utf-8")
        self._cache[template_name] = content
        return content

    def reload(self, template_name: str | None = None) -> None:
        """Clear cached template(s), forcing a re-read from disk on
        next `load()`. Useful for local dev; not typically called in
        production request paths.
        """
        if template_name is None:
            self._cache.clear()
        else:
            self._cache.pop(template_name, None)
