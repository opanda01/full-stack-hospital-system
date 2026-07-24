from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel


class ReceteKalemi(BaseModel, table=True):
    __tablename__ = "recete_kalemleri"

    muayene_id: int = Field(foreign_key="muayene_kayitlari.id", index=True)
    ilac_id: Optional[int] = Field(default=None, foreign_key="ilaclar.id", index=True)
    urun_adi: str = Field(max_length=200)
    barkod: Optional[str] = Field(default=None, max_length=64)
    doz: Optional[str] = Field(default=None, max_length=100)
    periyod: Optional[str] = Field(default=None, max_length=100)
    kullanim_sekli: Optional[str] = Field(default=None, max_length=40)
    adet: Optional[int] = Field(default=None, ge=1)
    sira: int = Field(default=1, ge=1)


class IlacEtkenMaddesi(BaseModel, table=True):
    __tablename__ = "ilac_etken_maddeleri"

    ilac_id: Optional[int] = Field(default=None, foreign_key="ilaclar.id", index=True)
    etken_kodu: str = Field(max_length=64, index=True)
    etken_adi: str = Field(max_length=200)
    urun_adi_eslesme: Optional[str] = Field(default=None, max_length=200)


class IlacEtkilesimi(BaseModel, table=True):
    __tablename__ = "ilac_etkilesimleri"

    etken_a: str = Field(max_length=64, index=True)
    etken_b: str = Field(max_length=64, index=True)
    seviye: str = Field(max_length=40)  # UYARI | KONTRANDIKE
    aciklama: str = Field(max_length=1000)
