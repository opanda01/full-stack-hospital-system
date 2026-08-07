"""CSSD / tıbbi cihaz sterilizasyon takibi (minimum)."""

from datetime import date
from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel


class SterilizasyonCihaz(BaseModel, table=True):
    __tablename__ = "sterilizasyon_cihazlari"

    ad: str = Field(max_length=150)
    envanter_no: str = Field(max_length=64, index=True)
    son_sterilizasyon: Optional[date] = None
    sonraki_kalibrasyon: Optional[date] = None
    durum: str = Field(default="AKTIF", max_length=32)
    notlar: Optional[str] = Field(default=None, max_length=500)
