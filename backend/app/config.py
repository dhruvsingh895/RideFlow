from urllib.parse import urlparse

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://rideflow:rideflow@localhost:5434/rideflow"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "rideflow-dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    grid_size: int = 20

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            value = value.replace("postgresql://", "postgresql+asyncpg://", 1)
        host = urlparse(value).hostname or ""
        if host in ("localhost", "127.0.0.1", "::1"):
            return value
        if "ssl=" not in value and "sslmode" not in value:
            separator = "&" if "?" in value else "?"
            value = f"{value}{separator}ssl=require"
        return value


settings = Settings()
