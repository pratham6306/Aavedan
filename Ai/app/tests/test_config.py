"""tests/test_config.py"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Settings, get_settings


def test_settings_load_from_env(settings: Settings) -> None:
    assert settings.gemini.api_key.get_secret_value() == "test-api-key"
    assert settings.app.environment == "local"


def test_settings_missing_required_secret_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    """GEMINI_API_KEY is required with no default — omitting it must
    fail loudly at construction time, not silently proceed."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    get_settings.cache_clear()

    with pytest.raises(ValidationError):
        Settings()


def test_settings_defaults_applied(settings: Settings) -> None:
    assert settings.gemini.model_name == "gemini-1.5-pro"
    assert settings.gemini.max_json_retries == 2
    assert settings.database.pool_min_size == 1


def test_get_settings_is_cached(settings: Settings) -> None:
    assert get_settings() is get_settings()
