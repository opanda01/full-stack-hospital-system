from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String
from sqlmodel import Field

from app.core.base_model import BaseModel
from app.core.enums import (
    AmeliyathaneDurumu,
    AmeliyatEkipRolu,
    AmeliyatPlaniDurumu,
    AnesteziTipi,
)


class Ameliyathane(BaseModel, table=True):
    __tablename__ = "ameliyathaneler"

    ad: str = Field(max_length=150, index=True)
    oda_no: str = Field(max_length=30, index=True)
    durum: AmeliyathaneDurumu = Field(
        default=AmeliyathaneDurumu.MUSAIT,
        sa_column=Column(String(30), nullable=False, index=True),
    )


class AmeliyatPlani(BaseModel, table=True):
    __tablename__ = "ameliyat_planlari"

    hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    ameliyathane_id: int = Field(foreign_key="ameliyathaneler.id", index=True)
    sorumlu_cerrah_id: int = Field(foreign_key="personel.id", index=True)
    planlanan_baslangic: datetime = Field(index=True)
    planlanan_sure_dk: int = Field(ge=15, le=24 * 60)
    gercek_baslangic: Optional[datetime] = Field(default=None, index=True)
    gercek_bitis: Optional[datetime] = Field(default=None, index=True)
    durum: AmeliyatPlaniDurumu = Field(
        default=AmeliyatPlaniDurumu.PLANLANDI,
        sa_column=Column(String(30), nullable=False, index=True),
    )
    ameliyat_adi: str = Field(max_length=300)
    iptal_gerekcesi: Optional[str] = Field(default=None, max_length=1000)


class AmeliyatEkibi(BaseModel, table=True):
    __tablename__ = "ameliyat_ekibi"

    ameliyat_plani_id: int = Field(foreign_key="ameliyat_planlari.id", index=True)
    personel_id: int = Field(foreign_key="personel.id", index=True)
    rol: AmeliyatEkipRolu = Field(
        sa_column=Column(String(30), nullable=False, index=True),
    )


class AnesteziKaydi(BaseModel, table=True):
    __tablename__ = "anestezi_kayitlari"

    ameliyat_plani_id: int = Field(
        foreign_key="ameliyat_planlari.id", unique=True, index=True
    )
    anestezi_tipi: AnesteziTipi = Field(
        sa_column=Column(String(30), nullable=False),
    )
    asa_skoru: int = Field(ge=1, le=5)
    anestezist_id: int = Field(foreign_key="personel.id", index=True)
    notlar: Optional[str] = Field(default=None, max_length=2000)
