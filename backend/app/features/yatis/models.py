from datetime import date, datetime
from typing import Optional

from sqlalchemy import Column, String
from sqlmodel import Field

from app.core.base_model import BaseModel, utc_now
from app.core.enums import KlinikDurum


class Servis(BaseModel, table=True):
    __tablename__ = "servisler"

    ad: str = Field(max_length=150, index=True)
    kod: str = Field(max_length=50, unique=True, index=True)
    kat_no: Optional[int] = Field(default=None)
    departman_id: Optional[int] = Field(
        default=None, foreign_key="departmanlar.id", index=True
    )


class Yatak(BaseModel, table=True):
    __tablename__ = "yataklar"

    servis_id: int = Field(foreign_key="servisler.id", index=True)
    oda_no: str = Field(max_length=30)
    yatak_no: str = Field(max_length=30)
    dolu_mu: bool = Field(default=False, index=True)


class YatisKaydi(BaseModel, table=True):
    __tablename__ = "yatis_kayitlari"

    hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    servis_id: int = Field(foreign_key="servisler.id", index=True)
    yatak_id: Optional[int] = Field(default=None, foreign_key="yataklar.id", index=True)
    protokol_no: str = Field(max_length=50, index=True)
    basvuru_no: Optional[str] = Field(default=None, max_length=50)
    dosya_no: Optional[str] = Field(default=None, max_length=50)
    muracaat_tarihi: Optional[date] = Field(default=None)
    yatis_tarihi: datetime = Field(index=True)
    cikis_tarihi: Optional[datetime] = Field(default=None)
    sigorta_turu: Optional[str] = Field(default=None, max_length=100)
    klinik_durum: KlinikDurum = Field(
        default=KlinikDurum.NORMAL,
        sa_column=Column(String(30), nullable=False, index=True),
    )
    sorumlu_doktor_id: Optional[int] = Field(
        default=None, foreign_key="doktorlar.id", index=True
    )
    sorumlu_hemsire_id: Optional[int] = Field(
        default=None, foreign_key="personel.id", index=True
    )
    kontrol_edildi_mi: bool = Field(default=False)
    aktif_mi: bool = Field(default=True, index=True)


class ServisHareketi(BaseModel, table=True):
    __tablename__ = "servis_hareketleri"

    yatis_id: int = Field(foreign_key="yatis_kayitlari.id", index=True)
    eski_servis_id: Optional[int] = Field(
        default=None, foreign_key="servisler.id", index=True
    )
    yeni_servis_id: int = Field(foreign_key="servisler.id", index=True)
    tarih: datetime = Field(default_factory=utc_now)
    aciklama: Optional[str] = Field(default=None, max_length=500)


class YatakHareketi(BaseModel, table=True):
    __tablename__ = "yatak_hareketleri"

    yatis_id: int = Field(foreign_key="yatis_kayitlari.id", index=True)
    eski_yatak_id: Optional[int] = Field(
        default=None, foreign_key="yataklar.id", index=True
    )
    yeni_yatak_id: int = Field(foreign_key="yataklar.id", index=True)
    tarih: datetime = Field(default_factory=utc_now)
    aciklama: Optional[str] = Field(default=None, max_length=500)


class IzinHareketi(BaseModel, table=True):
    __tablename__ = "izin_hareketleri"

    yatis_id: int = Field(foreign_key="yatis_kayitlari.id", index=True)
    baslangic: datetime
    bitis: Optional[datetime] = Field(default=None)
    aciklama: Optional[str] = Field(default=None, max_length=500)


class AmeliyatBilgisi(BaseModel, table=True):
    __tablename__ = "ameliyat_bilgileri"

    yatis_id: int = Field(foreign_key="yatis_kayitlari.id", index=True)
    tarih: datetime
    ameliyat_adi: str = Field(max_length=255)
    notlar: Optional[str] = Field(default=None, max_length=2000)


class Refakatci(BaseModel, table=True):
    __tablename__ = "refakatciler"

    yatis_id: int = Field(foreign_key="yatis_kayitlari.id", unique=True, index=True)
    ad_soyad: str = Field(max_length=150)
    yakinlik: Optional[str] = Field(default=None, max_length=100)
    telefon: Optional[str] = Field(default=None, max_length=30)


class HastaIslemLogu(BaseModel, table=True):
    __tablename__ = "hasta_islem_loglari"

    yatis_id: int = Field(foreign_key="yatis_kayitlari.id", index=True)
    yapan_kullanici_id: int = Field(foreign_key="kullanicilar.id", index=True)
    islem_tipi: str = Field(max_length=50, index=True)
    detay: Optional[str] = Field(default=None, max_length=2000)


class VitalBulgu(BaseModel, table=True):
    __tablename__ = "vital_bulgular"

    yatis_id: int = Field(foreign_key="yatis_kayitlari.id", index=True)
    olcum_zamani: datetime = Field(default_factory=utc_now, index=True)
    tansiyon_sistolik: Optional[int] = Field(default=None)
    tansiyon_diastolik: Optional[int] = Field(default=None)
    nabiz: Optional[int] = Field(default=None)
    ates: Optional[float] = Field(default=None)
    solunum: Optional[int] = Field(default=None)
    spo2: Optional[int] = Field(default=None)
    agri_skoru: Optional[int] = Field(default=None)
    giren_hemsire_id: Optional[int] = Field(
        default=None, foreign_key="personel.id", index=True
    )
    notlar: Optional[str] = Field(default=None, max_length=500)


class IlacUygulama(BaseModel, table=True):
    __tablename__ = "ilac_uygulamalari"

    yatis_id: int = Field(foreign_key="yatis_kayitlari.id", index=True)
    ilac_adi: str = Field(max_length=200)
    doz: Optional[str] = Field(default=None, max_length=100)
    kullanim_sekli: str = Field(
        default="ORAL",
        sa_column=Column(String(30), nullable=False),
    )
    planlanan_saat: datetime = Field(index=True)
    durum: str = Field(
        default="BEKLIYOR",
        sa_column=Column(String(30), nullable=False, index=True),
    )
    uygulayan_hemsire_id: Optional[int] = Field(
        default=None, foreign_key="personel.id", index=True
    )
    uygulandi_at: Optional[datetime] = Field(default=None)
    notlar: Optional[str] = Field(default=None, max_length=500)


class HastaNotu(BaseModel, table=True):
    __tablename__ = "hasta_notlari"

    yatis_id: int = Field(foreign_key="yatis_kayitlari.id", index=True)
    yazar_id: int = Field(foreign_key="kullanicilar.id", index=True)
    metin: str = Field(max_length=2000)


class HemsireGorevi(BaseModel, table=True):
    __tablename__ = "hemsire_gorevleri"

    baslik: str = Field(max_length=255)
    yatis_id: Optional[int] = Field(
        default=None, foreign_key="yatis_kayitlari.id", index=True
    )
    atanan_hemsire_id: int = Field(foreign_key="personel.id", index=True)
    son_tarih: datetime = Field(index=True)
    tamamlandi_mi: bool = Field(default=False, index=True)
    tamamlandi_at: Optional[datetime] = Field(default=None)


class VardiyaDevirNotu(BaseModel, table=True):
    __tablename__ = "vardiya_devir_notlari"

    yazar_id: int = Field(foreign_key="kullanicilar.id", index=True)
    metin: str = Field(max_length=4000)
    yatis_id: Optional[int] = Field(
        default=None, foreign_key="yatis_kayitlari.id", index=True
    )
    vardiya_tarihi: date = Field(index=True)


class PanelBildirim(BaseModel, table=True):
    __tablename__ = "panel_bildirimleri"

    alici_id: int = Field(foreign_key="kullanicilar.id", index=True)
    baslik: str = Field(max_length=255)
    govde: str = Field(max_length=2000)
    tip: str = Field(
        default="GENEL",
        sa_column=Column(String(30), nullable=False, index=True),
    )
    okundu_mu: bool = Field(default=False, index=True)
    kaynak_tip: Optional[str] = Field(default=None, max_length=50)
    kaynak_id: Optional[int] = Field(default=None)
