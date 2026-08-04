"""Hasta yasal temsilci (veli/vasi) kayıtları."""

from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel


class HastaYasalTemsilci(BaseModel, table=True):
    __tablename__ = "hasta_yasal_temsilciler"

    hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    tur: str = Field(default="VELI", max_length=30, index=True)  # VELI | VASI | YASAL_TEMSILCI
    ad_soyad: str = Field(max_length=200)
    tc_kimlik_no: Optional[str] = Field(default=None, max_length=11)
    telefon: Optional[str] = Field(default=None, max_length=20)
    yakinlik: Optional[str] = Field(default=None, max_length=80)
    aktif_mi: bool = Field(default=True, index=True)
