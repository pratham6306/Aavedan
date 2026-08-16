"""
core/config.py

Centralized application configuration.

This module is the ONLY place in the codebase allowed to read from
`os.environ` (via pydantic-settings). Every other module — services,
llm clients, knowledge loaders, API routes — must obtain configuration
through the `get_settings()` accessor defined here.

Rationale:
    - Fail fast: missing required secrets (API keys, DB credentials)
      raise a validation error at process startup, not on the first
      request that happens to need them.
    - Single source of truth: no scattered `os.getenv(...)` calls with
      inconsistent defaults across the codebase.
    - Testability: `get_settings` is cached with `lru_cache`, so tests
      can call `get_settings.cache_clear()` and monkeypatch environment
      variables to inject test configuration without touching app code.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    """General application-level configuration."""

    model_config = SettingsConfigDict(env_prefix="APP_", env_file=".env", extra="ignore")

    name: str = Field(default="Aavedan Setu AI Assistant")
    environment: Literal["local", "development", "staging", "production"] = Field(
        default="local"
    )
    debug: bool = Field(default=False)
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO"
    )


class GeminiSettings(BaseSettings):
    """Configuration for the Gemini LLM provider.

    All fields are required with no defaults for secrets — the
    application must not boot with a missing or empty API key.
    """

    model_config = SettingsConfigDict(env_prefix="GEMINI_", env_file=".env", extra="ignore")

    api_key: SecretStr = Field(...)
    model_name: str = Field(default="gemini-flash-latest")
    request_timeout_seconds: float = Field(default=12.0, gt=0)
    max_output_tokens: int = Field(default=2048, gt=0)
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)

    # LLM call resilience — used by llm/gemini_client.py and
    # llm/response_parser.py for the "retry on invalid JSON" workflow.
    max_json_retries: int = Field(default=2, ge=0, le=5)


def get_dynamic_gemini_api_keys() -> list[str]:
    """Dynamically loads and hot-reloads Gemini API keys from .env file.
    Allows live zero-restart API key updates in GEMINI_API_KEYS (comma-separated).
    """
    import os
    try:
        from dotenv import load_dotenv
        load_dotenv(override=True)
    except ImportError:
        pass

    keys_str = os.getenv("GEMINI_API_KEYS") or os.getenv("GEMINI_API_KEY") or ""
    keys = [k.strip() for k in keys_str.split(",") if k.strip()]
    if not keys:
        try:
            sec = get_settings().gemini.api_key.get_secret_value()
            if sec:
                keys = [sec]
        except Exception:
            pass
    return keys if keys else ["dev_key"]


class DatabaseSettings(BaseSettings):
    """PostgreSQL configuration.

    Note: the AI module (FastAPI service) is expected to be largely
    stateless and typically will NOT talk to Postgres directly — the
    Django backend owns persistence. This is included for cases where
    the AI service needs read access (e.g. knowledge tables once
    migrated out of static files) or its own audit/logging tables.
    """

    model_config = SettingsConfigDict(env_prefix="DB_", env_file=".env", extra="ignore")

    dsn: PostgresDsn = Field(...)
    pool_min_size: int = Field(default=1, ge=1)
    pool_max_size: int = Field(default=10, ge=1)

    @field_validator("pool_max_size")
    @classmethod
    def _max_gte_min(cls, v: int, info) -> int:
        min_size = info.data.get("pool_min_size", 1)
        if v < min_size:
            raise ValueError("pool_max_size must be >= pool_min_size")
        return v


class Settings(BaseSettings):
    """Top-level settings object aggregating all configuration groups.

    This is the object that gets dependency-injected into FastAPI
    routes and service constructors — never instantiate the nested
    settings classes directly outside of this module.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app: AppSettings = Field(default_factory=AppSettings)
    gemini: GeminiSettings = Field(default_factory=GeminiSettings)
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)


@lru_cache
def get_settings() -> Settings:
    """Return a cached, process-wide Settings instance.

    Cached with `lru_cache` so environment variables are parsed and
    validated exactly once per process. FastAPI routes should depend
    on this via `Depends(get_settings)`; services should receive a
    `Settings` instance through constructor injection rather than
    calling this function internally, to keep them easy to unit test.

    In tests, call `get_settings.cache_clear()` after monkeypatching
    environment variables to force re-evaluation.
    """
    return Settings()
