"""tests/test_text_utils.py"""

from __future__ import annotations

from app.models.enums import Language
from app.utils.text import clean_text, detect_language


def test_clean_text_collapses_whitespace() -> None:
    assert clean_text("Hello   \n\n  world  ") == "Hello world"


def test_detect_language_english() -> None:
    assert detect_language("There is a pothole near the market.") == Language.ENGLISH


def test_detect_language_hindi() -> None:
    assert detect_language("सड़क में एक बड़ा गड्ढा है") == Language.HINDI


def test_detect_language_odia() -> None:
    assert detect_language("ରାସ୍ତାରେ ଏକ ବଡ଼ ଗାତ ଅଛି") == Language.ODIA
