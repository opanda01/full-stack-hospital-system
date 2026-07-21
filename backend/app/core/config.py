from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = "postgresql+psycopg://hastane:hastane@localhost:5432/hastane_db"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    OTP_TTL_SECONDS: int = 300
    OTP_MAX_DENEME: int = 5
    OTP_RATE_LIMIT_DAKIKA: int = 1
    OTP_GUNLUK_MAX: int = 5

    BILDIRIM_BACKEND: str = "console"
    TEMP_SIFRE_UZUNLUK: int = 12

    # Virgülle ayrılmış; boş = X-Forwarded-For hiç okunmaz
    TRUSTED_PROXY_IPS: str = ""

    # RFC 8594 Sunset — örn. "Sat, 01 Jan 2027 00:00:00 GMT"
    AUTH_REGISTER_SUNSET: str = "Sat, 01 Jan 2027 00:00:00 GMT"

    @property
    def trusted_proxy_ip_set(self) -> frozenset[str]:
        if not self.TRUSTED_PROXY_IPS.strip():
            return frozenset()
        return frozenset(
            p.strip() for p in self.TRUSTED_PROXY_IPS.split(",") if p.strip()
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
