from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String
from sqlmodel import Field

from app.core.base_model import BaseModel, utc_now
from app.core.enums import GuvenlikOlayDurumu, GuvenlikOlayTipi, KayipEsyaDurumu


class GuvenlikOlayi(BaseModel, table=True):
    __tablename__ = "guvenlik_olaylari"

    tip: GuvenlikOlayTipi = Field(
        sa_column=Column(String(30), nullable=False, index=True),
    )
    durum: GuvenlikOlayDurumu = Field(
        default=GuvenlikOlayDurumu.ACIK,
        sa_column=Column(String(30), nullable=False, index=True),
    )
    yer: str = Field(max_length=200)
    ozet: str = Field(max_length=2000)
    mudahale_notu: Optional[str] = Field(default=None, max_length=2000)
    olay_zamani: datetime = Field(default_factory=utc_now, index=True)
    olusturan_id: int = Field(foreign_key="kullanicilar.id", index=True)
    beyaz_kod_referans: Optional[str] = Field(default=None, max_length=100)
    kolluk_bilgilendirildi: bool = Field(default=False)


class GuvenlikZiyaretci(BaseModel, table=True):
    __tablename__ = "guvenlik_ziyaretciler"

    ad_soyad: str = Field(max_length=150)
    tc_kimlik: Optional[str] = Field(default=None, max_length=11, index=True)
    ziyaret_edilen: str = Field(max_length=150)
    servis: Optional[str] = Field(default=None, max_length=100)
    yatis_id: Optional[int] = Field(
        default=None, foreign_key="yatis_kayitlari.id", index=True
    )
    giris_zamani: datetime = Field(default_factory=utc_now, index=True)
    cikis_zamani: Optional[datetime] = Field(default=None)
    kaydeden_id: int = Field(foreign_key="kullanicilar.id", index=True)
    notlar: Optional[str] = Field(default=None, max_length=500)


class KayipEsya(BaseModel, table=True):
    __tablename__ = "kayip_esyalar"

    tanim: str = Field(max_length=300)
    bulunan_yer: str = Field(max_length=200)
    bulunan_tarih: datetime = Field(default_factory=utc_now, index=True)
    durum: KayipEsyaDurumu = Field(
        default=KayipEsyaDurumu.BEKLIYOR,
        sa_column=Column(String(30), nullable=False, index=True),
    )
    teslim_alan: Optional[str] = Field(default=None, max_length=150)
    kaydeden_id: int = Field(foreign_key="kullanicilar.id", index=True)
    notlar: Optional[str] = Field(default=None, max_length=500)


class GuvenlikDevriye(BaseModel, table=True):
    __tablename__ = "guvenlik_devriyeler"

    bolge: str = Field(max_length=150)
    baslangic: datetime = Field(default_factory=utc_now, index=True)
    bitis: Optional[datetime] = Field(default=None)
    bulgu: Optional[str] = Field(default=None, max_length=2000)
    personel_id: int = Field(foreign_key="personel.id", index=True)
