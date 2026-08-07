"""Transfüzyon güvenlik kayıtları (minimum)."""

from datetime import datetime
from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel


class TransfuzyonKaydi(BaseModel, table=True):
    __tablename__ = "transfuzyon_kayitlari"

    yatis_id: int = Field(foreign_key="yatis_kayitlari.id", index=True)
    hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    verilen_kan_grubu: str = Field(max_length=8)
    hasta_kan_grubu: str = Field(max_length=8)
    uyumlu_mi: bool = Field(default=False)
    birinci_imza_kullanici_id: int = Field(foreign_key="kullanicilar.id")
    ikinci_imza_kullanici_id: Optional[int] = Field(
        default=None, foreign_key="kullanicilar.id"
    )
    uygulama_zamani: datetime
    notlar: Optional[str] = Field(default=None, max_length=500)
