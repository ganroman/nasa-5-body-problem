from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    # Neon's pooler (PgBouncer) is fine for the app; migrations should use a direct connection.
    database_url_direct: str | None = None

    # Eustella AI (OpenAI-compatible). EUSTELLA_* names are accepted so .env lines can be copied
    # from the team's other Eustella project; only the key is required.
    si_base_url: str | None = Field("https://api.eustella.com/v1", validation_alias=AliasChoices("SI_BASE_URL", "EUSTELLA_BASE_URL"))
    si_api_key: str | None = Field(None, validation_alias=AliasChoices("SI_API_KEY", "EUSTELLA_API_KEY"))
    si_model: str | None = Field("eustella-v1.5", validation_alias=AliasChoices("SI_MODEL", "EUSTELLA_MODEL"))

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
