from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    # Neon's pooler (PgBouncer) is fine for the app; migrations should use a direct connection.
    database_url_direct: str | None = None

    si_base_url: str | None = None
    si_api_key: str | None = None
    si_model: str | None = None

    cors_origins: str = "http://localhost:8000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def migration_url(self) -> str:
        return self.database_url_direct or self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
