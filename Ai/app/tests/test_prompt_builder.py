"""tests/test_prompt_builder.py"""

from __future__ import annotations

from pathlib import Path

import pytest

from app.exceptions.llm import PromptRenderError
from app.llm.prompt_builder import PromptBuilder
from app.llm.prompt_loader import PromptLoader
from app.models.category import Category


@pytest.fixture
def templates_dir(tmp_path: Path) -> Path:
    (tmp_path / "greeting.txt").write_text("Hello {{ name }}, you are {{ age }}.")
    return tmp_path


def test_prompt_loader_reads_and_caches(templates_dir: Path) -> None:
    loader = PromptLoader(prompts_dir=templates_dir)
    content = loader.load("greeting.txt")
    assert "Hello {{ name }}" in content


def test_prompt_loader_missing_file_raises(templates_dir: Path) -> None:
    loader = PromptLoader(prompts_dir=templates_dir)
    with pytest.raises(PromptRenderError):
        loader.load("does_not_exist.txt")


def test_prompt_builder_substitutes_variables(templates_dir: Path) -> None:
    builder = PromptBuilder(PromptLoader(prompts_dir=templates_dir))
    result = builder.build("greeting.txt", name="Asha", age=30)
    assert result == "Hello Asha, you are 30."


def test_prompt_builder_missing_variable_raises(templates_dir: Path) -> None:
    builder = PromptBuilder(PromptLoader(prompts_dir=templates_dir))
    with pytest.raises(PromptRenderError):
        builder.build("greeting.txt", name="Asha")  # missing "age"


def test_format_category_list_uses_display_language() -> None:
    categories = [
        Category(
            code="ROAD_DAMAGE",
            default_department_code="PWD",
            display_name={"en": "Road Damage", "hi": "सड़क क्षति"},
        )
    ]
    result = PromptBuilder.format_category_list(categories, "hi")
    assert "सड़क क्षति" in result

    result_en = PromptBuilder.format_category_list(categories, "en")
    assert "Road Damage" in result_en
