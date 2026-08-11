"""Hasta aşı kayıtları."""

from datetime import date
from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel


class HastaAsiKaydi(BaseModel, table=True):
    __tablename__ = "hasta_asi_kayitlari"

    hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    asi_adi: str = Field(max_length=200)
    uygulama_tarihi: date
    sonraki_tarih: Optional[date] = Field(default=None)
    notlar: Optional[str] = Field(default=None, max_length=500)
    uygulayan: Optional[str] = Field(default=None, max_length=200)
