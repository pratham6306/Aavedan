"""
utils/text.py

Preprocessing helpers: whitespace/encoding cleanup and language
detection. Kept meaning-preserving — this is NOT where business logic
or LLM calls happen, only mechanical text normalization.
"""

from __future__ import annotations

import re
import unicodedata

from app.models.enums import Language

_WHITESPACE_RE = re.compile(r"\s+")

# Unicode block ranges used for cheap script-based language detection.
_DEVANAGARI_RANGE = (0x0900, 0x097F)  # Hindi
_ODIA_RANGE = (0x0B00, 0x0B7F)


def clean_text(raw_text: str) -> str:
    """Normalize whitespace/unicode without altering meaning.

    - Unicode-normalizes (NFC) so visually identical characters
      compare/hash consistently.
    - Collapses runs of whitespace to single spaces.
    - Strips leading/trailing whitespace.
    """
    normalized = unicodedata.normalize("NFC", raw_text)
    collapsed = _WHITESPACE_RE.sub(" ", normalized)
    return collapsed.strip()


def detect_language(text: str) -> Language:
    """Detect whether `text` is primarily Hindi, Odia, or English,
    using Unicode script ranges.

    This is a lightweight heuristic, not a full language-ID model:
    sufficient to distinguish these three specific scripts (Devanagari
    vs Odia vs Latin), which is all this project needs. If broader
    language support is added later, replace this with a proper
    language-detection library — call sites depend only on this
    function's signature, not its implementation.
    """
    devanagari_count = 0
    odia_count = 0

    for char in text:
        codepoint = ord(char)
        if _DEVANAGARI_RANGE[0] <= codepoint <= _DEVANAGARI_RANGE[1]:
            devanagari_count += 1
        elif _ODIA_RANGE[0] <= codepoint <= _ODIA_RANGE[1]:
            odia_count += 1

    if odia_count > devanagari_count and odia_count > 0:
        return Language.ODIA
    if devanagari_count > 0:
        return Language.HINDI
    return Language.ENGLISH
