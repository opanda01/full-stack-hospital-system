from datetime import datetime

from pydantic import BaseModel, Field

from app.core.enums import IlacTalepDurumu, KullanimSekli


class IlacTalepKalemCreate(BaseModel):
    ilac_id: int | None = None
    urun_kodu: str = Field(max_length=64)
    urun_adi: str = Field(max_length=200)
    istenen_miktar: float = Field(gt=0)
    verilen_miktar: float = 0
    kullanim_sekli: KullanimSekli = KullanimSekli.ORAL
    periyod: str | None = Field(default=None, max_length=100)
    doz: str | None = Field(default=None, max_length=100)
    olcu_birimi: str | None = Field(default=None, max_length=50)
    uygulama_suresi: str | None = Field(default=None, max_length=100)


class IlacTalepCreate(BaseModel):
    yatis_id: int
    isteyen_doktor_id: int | None = None
    isteyen_birim: str | None = Field(default=None, max_length=150)
    kalemler: list[IlacTalepKalemCreate] = Field(min_length=1)
    gonder: bool = True
    acil_mi: bool = False


class IlacTalepDurumPatch(BaseModel):
    durum: IlacTalepDurumu


class IlacTalepKalemRead(BaseModel):
    id: int
    talep_id: int
    ilac_id: int | None
    urun_kodu: str
    urun_adi: str
    istenen_miktar: float
    verilen_miktar: float
    kullanim_sekli: str
    periyod: str | None
    doz: str | None
    olcu_birimi: str | None
    uygulama_suresi: str | None

    model_config = {"from_attributes": True}


class IlacTalepRead(BaseModel):
    id: int
    yatis_id: int
    hasta_id: int
    hasta_ad_soyad: str | None = None
    protokol_no: str | None = None
    servis_id: int
    servis_ad: str | None = None
    istek_tarihi: datetime
    isteyen_doktor_id: int | None
    isteyen_birim: str | None
    isteyen_hemsire_id: int | None
    durum: str
    acil_mi: bool = False
    kalemler: list[IlacTalepKalemRead] = []


class IlacTalepSatirRead(BaseModel):
    """Liste satırı: talep × kalem düzleştirilmiş."""

    talep_id: int
    kalem_id: int
    istek_tarihi: datetime
    hasta_ad_soyad: str | None
    protokol_no: str | None
    urun_kodu: str
    urun_adi: str
    istenen_miktar: float
    verilen_miktar: float
    durum: str
    acil_mi: bool


class StokDurumRead(BaseModel):
    ilac_id: int
    ad: str
    barkod: str | None
    stok: int
    kritik_stok: int
    kritik_mi: bool


class VerilenIlacRead(BaseModel):
    talep_id: int
    istek_tarihi: datetime
    urun_kodu: str
    urun_adi: str
    verilen_miktar: float
    kullanim_sekli: str
    doz: str | None
    olcu_birimi: str | None
