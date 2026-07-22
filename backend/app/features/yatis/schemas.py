from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.core.enums import KlinikDurum, YatisIslemTipi


class ServisRead(BaseModel):
    id: int
    ad: str
    kod: str
    kat_no: int | None
    departman_id: int | None

    model_config = {"from_attributes": True}


class YatakRead(BaseModel):
    id: int
    servis_id: int
    oda_no: str
    yatak_no: str
    dolu_mu: bool

    model_config = {"from_attributes": True}


class YatisListeItem(BaseModel):
    id: int
    protokol_no: str
    hasta_id: int
    hasta_ad_soyad: str
    yas: int | None
    cinsiyet: str | None
    yatak_no: str | None
    oda_no: str | None
    yatis_tarihi: datetime
    gecen_gun: int
    sorumlu_doktor_id: int | None
    sorumlu_doktor_ad: str | None
    sorumlu_hemsire_id: int | None
    sorumlu_hemsire_ad: str | None
    klinik_durum: str
    kontrol_edildi_mi: bool
    servis_id: int
    servis_ad: str | None


class YatisDetay(BaseModel):
    id: int
    hasta_id: int
    protokol_no: str
    basvuru_no: str | None
    dosya_no: str | None
    muracaat_tarihi: date | None
    yatis_tarihi: datetime
    cikis_tarihi: datetime | None
    sigorta_turu: str | None
    klinik_durum: str
    kontrol_edildi_mi: bool
    aktif_mi: bool
    servis_id: int
    servis_ad: str | None
    yatak_id: int | None
    yatak_no: str | None
    oda_no: str | None
    sorumlu_doktor_id: int | None
    sorumlu_doktor_ad: str | None
    sorumlu_hemsire_id: int | None
    sorumlu_hemsire_ad: str | None
    hasta_ad_soyad: str
    adres: str | None
    kan_grubu: str | None
    dogum_tarihi: date | None
    yas: int | None
    cinsiyet: str | None
    bakiye: Decimal
    refakatci_ad_soyad: str | None = None
    refakatci_yakinlik: str | None = None
    refakatci_telefon: str | None = None


class ServisHareketRead(BaseModel):
    id: int
    yatis_id: int
    eski_servis_id: int | None
    yeni_servis_id: int
    tarih: datetime
    aciklama: str | None

    model_config = {"from_attributes": True}


class YatakHareketRead(BaseModel):
    id: int
    yatis_id: int
    eski_yatak_id: int | None
    yeni_yatak_id: int
    tarih: datetime
    aciklama: str | None

    model_config = {"from_attributes": True}


class IzinHareketRead(BaseModel):
    id: int
    yatis_id: int
    baslangic: datetime
    bitis: datetime | None
    aciklama: str | None

    model_config = {"from_attributes": True}


class AmeliyatRead(BaseModel):
    id: int
    yatis_id: int
    tarih: datetime
    ameliyat_adi: str
    notlar: str | None

    model_config = {"from_attributes": True}


class KonsultasyonOzet(BaseModel):
    id: int
    isteyen_doktor_id: int
    hedef_doktor_id: int
    durum: str
    notlar: str | None
    yanit_tarihi: datetime | None


class HastaIslemLogRead(BaseModel):
    id: int
    yatis_id: int
    yapan_kullanici_id: int
    islem_tipi: str
    detay: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class YatisIslemRequest(BaseModel):
    tip: YatisIslemTipi
    yeni_servis_id: int | None = None
    yeni_yatak_id: int | None = None
    sorumlu_doktor_id: int | None = None
    sorumlu_hemsire_id: int | None = None
    izin_baslangic: datetime | None = None
    izin_bitis: datetime | None = None
    aciklama: str | None = Field(default=None, max_length=500)
    refakatci_ad_soyad: str | None = Field(default=None, max_length=150)
    refakatci_yakinlik: str | None = Field(default=None, max_length=100)
    refakatci_telefon: str | None = Field(default=None, max_length=30)
    klinik_durum: KlinikDurum | None = None


class VitalCreate(BaseModel):
    olcum_zamani: datetime | None = None
    tansiyon_sistolik: int | None = None
    tansiyon_diastolik: int | None = None
    nabiz: int | None = None
    ates: float | None = None
    solunum: int | None = None
    spo2: int | None = None
    agri_skoru: int | None = None
    notlar: str | None = Field(default=None, max_length=500)


class VitalRead(BaseModel):
    id: int
    yatis_id: int
    olcum_zamani: datetime
    tansiyon_sistolik: int | None
    tansiyon_diastolik: int | None
    nabiz: int | None
    ates: float | None
    solunum: int | None
    spo2: int | None
    agri_skoru: int | None
    giren_hemsire_id: int | None
    notlar: str | None

    model_config = {"from_attributes": True}


class IlacUygulamaCreate(BaseModel):
    ilac_adi: str = Field(max_length=200)
    doz: str | None = None
    kullanim_sekli: str = "ORAL"
    planlanan_saat: datetime
    notlar: str | None = None


class IlacUygulamaDurumPatch(BaseModel):
    durum: str


class IlacUygulamaRead(BaseModel):
    id: int
    yatis_id: int
    ilac_adi: str
    doz: str | None
    kullanim_sekli: str
    planlanan_saat: datetime
    durum: str
    uygulayan_hemsire_id: int | None
    uygulandi_at: datetime | None
    notlar: str | None

    model_config = {"from_attributes": True}


class HastaNotCreate(BaseModel):
    metin: str = Field(max_length=2000)


class HastaNotRead(BaseModel):
    id: int
    yatis_id: int
    yazar_id: int
    metin: str
    created_at: datetime

    model_config = {"from_attributes": True}


class GorevCreate(BaseModel):
    baslik: str = Field(max_length=255)
    yatis_id: int | None = None
    atanan_hemsire_id: int | None = None
    son_tarih: datetime


class GorevRead(BaseModel):
    id: int
    baslik: str
    yatis_id: int | None
    atanan_hemsire_id: int
    son_tarih: datetime
    tamamlandi_mi: bool
    tamamlandi_at: datetime | None

    model_config = {"from_attributes": True}


class DevirNotCreate(BaseModel):
    metin: str = Field(max_length=4000)
    yatis_id: int | None = None
    vardiya_tarihi: date | None = None


class DevirNotRead(BaseModel):
    id: int
    yazar_id: int
    metin: str
    yatis_id: int | None
    vardiya_tarihi: date
    created_at: datetime

    model_config = {"from_attributes": True}


class BildirimRead(BaseModel):
    id: int
    alici_id: int
    baslik: str
    govde: str
    tip: str
    okundu_mu: bool
    kaynak_tip: str | None
    kaynak_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}