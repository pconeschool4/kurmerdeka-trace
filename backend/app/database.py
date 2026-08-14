"""
Supabase client singleton + settings loader.
Baca .env dari backend/.env (copy dari .env.example).
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from supabase import create_client, Client


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    groq_api_key: str
    app_env: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


def get_supabase() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)
