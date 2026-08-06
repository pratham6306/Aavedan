"""
llm/

Everything related to talking to the LLM provider (Gemini), split by
responsibility:

    prompt_loader.py   - reads template files from disk
    prompt_builder.py  - injects variables into templates
    gemini_client.py   - pure I/O: send prompt, get raw text back
    response_parser.py - extract/validate JSON, drive retry-on-invalid
                          JSON loop

No module outside llm/ should import GeminiClient directly except
services/ (for constructor injection) — API routes never touch this
package.
"""

from app.llm.gemini_client import GeminiClient
from app.llm.prompt_builder import PromptBuilder
from app.llm.prompt_loader import PromptLoader
from app.llm.response_parser import parse_and_validate, parse_with_retries

__all__ = [
    "GeminiClient",
    "PromptBuilder",
    "PromptLoader",
    "parse_and_validate",
    "parse_with_retries",
]
