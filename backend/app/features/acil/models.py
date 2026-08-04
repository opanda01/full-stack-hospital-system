"""Acil servis triyaj kayıtları."""

from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel
from app.core.enums import TriyajRenk


class AcilTriyajKaydi(BaseModel, table=True):
    __tablename__ = "acil_triyaj_kayitlari"

    hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    randevu_id: Optional[int] = Field(default=None, foreign_key="randevular.id")
    sikayet_ozet: str = Field(max_length=2000)
    ats_skor: Optional[int] = Field(default=None)
    renk: TriyajRenk = Field(max_length=20, index=True)
    kaydeden_id: int = Field(foreign_key="kullanicilar.id", index=True)
    notlar: Optional[str] = Field(default=None, max_length=1000)
