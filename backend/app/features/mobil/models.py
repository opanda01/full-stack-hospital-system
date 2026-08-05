from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel


class HastaMobilCihaz(BaseModel, table=True):
    """Hasta mobil uygulaması Expo push token kaydı."""

    __tablename__ = "hasta_mobil_cihazlar"

    kullanici_id: int = Field(foreign_key="kullanicilar.id", index=True)
    expo_push_token: str = Field(max_length=512, unique=True, index=True)
    platform: str = Field(default="unknown", max_length=32)
    aktif_mi: bool = Field(default=True, index=True)

    device_id: Optional[str] = Field(default=None, max_length=128, index=True)
