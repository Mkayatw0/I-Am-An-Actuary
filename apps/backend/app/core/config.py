"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """App-wide settings loaded from .env / environment."""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://actuary:actuary_dev@localhost:5432/iam_an_actuary"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # Internal auth
    INTERNAL_API_KEY: str = "dev-api-key-change-in-production"

    # LLM
    LLM_PROVIDER: str = "qwen3"
    QWEN3_API_KEY: str = ""
    QWEN3_API_URL: str = "https://api.qwen.ai/v1"
    QWEN3_MODEL: str = "qwen3"

    # App
    DEBUG: bool = True

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()