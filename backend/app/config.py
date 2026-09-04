"""
Application configuration using Pydantic BaseSettings.

All values are read from environment variables (with .env file fallback).
This module is the single source of truth for configuration — no magic strings
scattered across the codebase. Add new settings here as needed.
"""

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Supabase ────────────────────────────────────────────────────────────
    supabase_url: str
    supabase_service_role_key: str
    # jwt_secret is optional — new Supabase projects use ECC (ES256) and
    # don't expose a shared secret. Token verification is done via Admin API.
    supabase_jwt_secret: str = ""

    # ── Application ─────────────────────────────────────────────────────────
    environment: str = "development"
    cors_origins: str = "http://localhost:3000"

    # ── Storage ─────────────────────────────────────────────────────────────
    resume_bucket: str = "resumes"
    max_resume_size_mb: int = 10

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def allowed_origins(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_resume_size_bytes(self) -> int:
        return self.max_resume_size_mb * 1024 * 1024


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return a cached Settings instance.

    Using lru_cache means environment variables are read exactly once at
    startup, not on every request. Call get_settings.cache_clear() in tests
    to reset between test cases.
    """
    return Settings()
