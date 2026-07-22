from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String
from sqlmodel import Field

from app.core.base_model import BaseModel, utc_now
from app.core.enums import IlacTalepDurumu, KullanimSekli


class IlacTalebi(BaseModel, table=True):
    __tablename__ = "ilac_talepleri"

    yatis_id: int = Field(foreign_key="yatis_kayitlari.id", index=True)
    hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    servis_id: int = Field(foreign_key="servisler.id", index=True)
    istek_tarihi: datetime = Field(default_factory=utc_now, index=True)
    isteyen_doktor_id: Optional[int] = Field(
        default=None, foreign_key="doktorlar.id", index=True
    )
    isteyen_birim: Optional[str] = Field(default=None, max_length=150)
    isteyen_hemsire_id: Optional[int] = Field(
        default=None, foreign_key="personel.id", index=True
    )
    durum: IlacTalepDurumu = Field(
        default=IlacTalepDurumu.YENI,
        sa_column=Column(String(30), nullable=False, index=True),
    )
    acil_mi: bool = Field(default=False, index=True)


class IlacTalepKalemi(BaseModel, table=True):
    __tablename__ = "ilac_talep_kalemleri"

    talep_id: int = Field(foreign_key="ilac_talepleri.id", index=True)
    ilac_id: Optional[int] = Field(default=None, foreign_key="ilaclar.id", index=True)
    urun_kodu: str = Field(max_length=64)
    urun_adi: str = Field(max_length=200)
    istenen_miktar: float = Field(default=0)
    verilen_miktar: float = Field(default=0)
    kullanim_sekli: KullanimSekli = Field(
        default=KullanimSekli.ORAL,
        sa_column=Column(String(30), nullable=False),
    )
    periyod: Optional[str] = Field(default=None, max_length=100)
    doz: Optional[str] = Field(default=None, max_length=100)
    olcu_birimi: Optional[str] = Field(default=None, max_length=50)
    uygulama_suresi: Optional[str] = Field(default=None, max_length=100)
