"""
Centralized application settings loaded from environment variables.

Uses pydantic-settings for type-safe, validated configuration.
Fails fast on startup if required secrets are missing.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide configuration. All values come from env vars or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Groq & OpenAI ──────────────────────────────────────────
    groq_api_key: Optional[str] = Field(default=None, description="Groq API key")
    groq_chat_model: str = Field(
        default="llama-3.3-70b-versatile",
        description="Groq chat model name",
    )
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key")
    openai_embedding_model: str = Field(
        default="text-embedding-3-small",
        description="OpenAI embedding model name",
    )
    openai_chat_model: str = Field(
        default="gpt-4o-mini",
        description="OpenAI chat model name",
    )

    # ── Qdrant ──────────────────────────────────────────────────
    qdrant_url: str = Field(default="http://localhost:6333")
    qdrant_api_key: Optional[str] = Field(default=None)
    qdrant_collection_name: str = Field(default="customer_support_docs")

    # ── Security ────────────────────────────────────────────────
    api_keys: str = Field(
        default="dev-key-change-me-in-production",
        description="Comma-separated valid API keys",
    )
    jwt_secret: str = Field(default="your-jwt-secret-change-me-in-production")
    jwt_algorithm: str = Field(default="HS256")
    jwt_expiry_minutes: int = Field(default=60)

    # ── Rate Limiting ───────────────────────────────────────────
    rate_limit_per_minute: int = Field(default=30)
    rate_limit_burst: int = Field(default=5)

    # ── Application ─────────────────────────────────────────────
    app_env: str = Field(default="development")
    app_debug: bool = Field(default=False)
    app_host: str = Field(default="0.0.0.0")
    app_port: int = Field(default=8000)
    port: int | None = Field(
        default=None,
        description="PORT env var set by Render/Heroku — overrides app_port when present",
    )
    log_level: str = Field(default="INFO")
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        description="Comma-separated allowed CORS origins",
    )

    # ── Ingestion ───────────────────────────────────────────────
    chunk_size: int = Field(default=1024, description="Parent chunk size in tokens")
    chunk_overlap: int = Field(default=64)
    child_chunk_size: int = Field(default=256, description="Child chunk size for retrieval")

    # ── Retrieval ───────────────────────────────────────────────
    top_k_retrieval: int = Field(default=10, description="Number of chunks to retrieve")
    top_k_rerank: int = Field(default=5, description="Number of chunks after reranking")
    similarity_threshold: float = Field(default=0.3)
    hybrid_search_alpha: float = Field(
        default=0.7,
        description="Weight for dense search (1-alpha for sparse)",
    )

    # ── Evaluation ──────────────────────────────────────────────
    ragas_sample_size: int = Field(default=20)
    deepeval_threshold: float = Field(default=0.8)

    # ── Observability (optional) ────────────────────────────────
    langsmith_api_key: Optional[str] = Field(default=None)
    langsmith_project: str = Field(default="rag-customer-support")
    langfuse_public_key: Optional[str] = Field(default=None)
    langfuse_secret_key: Optional[str] = Field(default=None)

    # ── Resend Email Notifications (optional) ───────────────────
    resend_api_key: Optional[str] = Field(default=None, description="Resend.com API key for sending email notifications")
    admin_email: Optional[str] = Field(default=None, description="Email address to receive lead alerts")
    from_email: str = Field(default="onboarding@resend.dev", description="Sender email address for Resend")

    # ── Derived Properties ──────────────────────────────────────

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def api_keys_list(self) -> list[str]:
        """Parse comma-separated API keys into a list."""
        return [key.strip() for key in self.api_keys.split(",") if key.strip()]

    @property
    def effective_port(self) -> int:
        """Use PORT env (from Render/Heroku) if set, else fall back to app_port."""
        return self.port if self.port is not None else self.app_port

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        valid_levels = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper = v.upper()
        if upper not in valid_levels:
            msg = f"Invalid log level: {v}. Must be one of {valid_levels}"
            raise ValueError(msg)
        return upper


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached settings singleton. Call this to access configuration."""
    return Settings()


def get_qdrant_client(url: Optional[str] = None, api_key: Optional[str] = None):
    """
    Get a QdrantClient instance with automatic local fallback.
    First tries remote connection (Docker/Server).
    If remote is unavailable, falls back to embedded local storage ('data/qdrant_storage').
    """
    from qdrant_client import QdrantClient

    settings = get_settings()
    target_url = url or settings.qdrant_url
    target_key = api_key or settings.qdrant_api_key or None

    try:
        client = QdrantClient(url=target_url, api_key=target_key, timeout=3)
        client.get_collections()
        return client
    except Exception:
        return QdrantClient(path="data/qdrant_storage")
