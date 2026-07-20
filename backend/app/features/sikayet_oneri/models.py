from datetime import datetime
from typing import Optional

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel, utc_now


class SikayetOneri(BaseModel, table=True):
    __tablename__ = "sikayet_oneri"

    gonderen_kullanici_id: int = Field(foreign_key="kullanicilar.id", index=True)
    tur: str = Field(max_length=50)  # SIKAYET | ONERI
    icerik: str = Field(max_length=5000)
    tarih: datetime = Field(default_factory=utc_now, index=True)
    durum: str = Field(default="ACIK", max_length=50, index=True)

    gonderen: Optional["Kullanici"] = Relationship()  # noqa: F821
