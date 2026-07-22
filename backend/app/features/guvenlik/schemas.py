from datetime import datetime

from pydantic import BaseModel, Field

from app.core.enums import GuvenlikOlayDurumu, GuvenlikOlayTipi, KayipEsyaDurumu


class GuvenlikOlayCreate(BaseModel):
    tip: GuvenlikOlayTipi
    yer: str = Field(max_length=200)
    ozet: str = Field(max_length=2000)
    olay_zamani: datetime | None = None
    beyaz_kod_referans: str | None = Field(default=None, max_length=100)
    kolluk_bilgilendirildi: bool = False


class GuvenlikOlayUpdate(BaseModel):
    durum: GuvenlikOlayDurumu | None = None
    mudahale_notu: str | None = Field(default=None, max_length=2000)
    beyaz_kod_referans: str | None = Field(default=None, max_length=100)
    kolluk_bilgilendirildi: bool | None = None


class GuvenlikOlayRead(BaseModel):
    id: int
    tip: GuvenlikOlayTipi
    durum: GuvenlikOlayDurumu
    yer: str
    ozet: str
    mudahale_notu: str | None = None
    olay_zamani: datetime
    olusturan_id: int
    beyaz_kod_referans: str | None = None
    kolluk_bilgilendirildi: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ZiyaretciCreate(BaseModel):
    ad_soyad: str = Field(max_length=150)
    tc_kimlik: str | None = Field(default=None, max_length=11)
    ziyaret_edilen: str = Field(max_length=150)
    servis: str | None = Field(default=None, max_length=100)
    yatis_id: int | None = None
    notlar: str | None = Field(default=None, max_length=500)


class ZiyaretciUpdate(BaseModel):
    cikis_zamani: datetime | None = None
    notlar: str | None = Field(default=None, max_length=500)


class ZiyaretciRead(BaseModel):
    id: int
    ad_soyad: str
    tc_kimlik: str | None = None
    ziyaret_edilen: str
    servis: str | None = None
    yatis_id: int | None = None
    giris_zamani: datetime
    cikis_zamani: datetime | None = None
    kaydeden_id: int
    notlar: str | None = None

    model_config = {"from_attributes": True}


class KayipEsyaCreate(BaseModel):
    tanim: str = Field(max_length=300)
    bulunan_yer: str = Field(max_length=200)
    bulunan_tarih: datetime | None = None
    notlar: str | None = Field(default=None, max_length=500)


class KayipEsyaUpdate(BaseModel):
    durum: KayipEsyaDurumu | None = None
    teslim_alan: str | None = Field(default=None, max_length=150)
    notlar: str | None = Field(default=None, max_length=500)


class KayipEsyaRead(BaseModel):
    id: int
    tanim: str
    bulunan_yer: str
    bulunan_tarih: datetime
    durum: KayipEsyaDurumu
    teslim_alan: str | None = None
    kaydeden_id: int
    notlar: str | None = None

    model_config = {"from_attributes": True}


class DevriyeCreate(BaseModel):
    bolge: str = Field(max_length=150)
    baslangic: datetime | None = None
    bulgu: str | None = Field(default=None, max_length=2000)


class DevriyeUpdate(BaseModel):
    bitis: datetime | None = None
    bulgu: str | None = Field(default=None, max_length=2000)


class DevriyeRead(BaseModel):
    id: int
    bolge: str
    baslangic: datetime
    bitis: datetime | None = None
    bulgu: str | None = None
    personel_id: int

    model_config = {"from_attributes": True}


class GuvenlikOzet(BaseModel):
    aktif_vardiya: int
    acik_olay: int
    bugun_cozulen: int
    nobet_saati: str | None = None
    acik_ziyaretci: int
    bekleyen_kayip_esya: int


class RefakatciSorguSonuc(BaseModel):
    yatis_id: int
    refakatci_ad_soyad: str
    yakinlik: str | None = None
    servis_adi: str | None = None
    yatak_kodu: str | None = None
    protokol_no: str
