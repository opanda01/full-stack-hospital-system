from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel


class Icd10Kodu(BaseModel, table=True):
    __tablename__ = "icd10_kodlari"

    kod: str = Field(max_length=16, unique=True, index=True)
    aciklama: str = Field(max_length=500)


class MuayeneTaniKodu(BaseModel, table=True):
    __tablename__ = "muayene_tani_kodlari"

    muayene_id: int = Field(foreign_key="muayene_kayitlari.id", index=True)
    icd10_kod: str = Field(max_length=16, index=True)
    tani_aciklama: Optional[str] = Field(default=None, max_length=500)
    sira: int = Field(default=1)


class TetkikSonucKalemi(BaseModel, table=True):
    __tablename__ = "tetkik_sonuc_kalemleri"

    tetkik_id: int = Field(foreign_key="tetkikler.id", index=True)
    parametre_adi: str = Field(max_length=150)
    loinc_kodu: Optional[str] = Field(default=None, max_length=32)
    deger_sayisal: Optional[float] = Field(default=None)
    deger_metin: Optional[str] = Field(default=None, max_length=200)
    birim: Optional[str] = Field(default=None, max_length=40)
    ref_min: Optional[float] = Field(default=None)
    ref_max: Optional[float] = Field(default=None)
    anormal_mi: bool = Field(default=False)
    panic_min: Optional[float] = Field(default=None)
    panic_max: Optional[float] = Field(default=None)
    panic_mi: bool = Field(default=False)
