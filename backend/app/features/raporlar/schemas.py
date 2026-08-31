from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

ExportFormat = Literal["csv", "pdf"]


class RaporDagilim(BaseModel):
    etiket: str
    deger: int


class GunlukAdet(BaseModel):
    tarih: str
    adet: int


class RandevuRaporRead(BaseModel):
    baslangic: date
    bitis: date
    toplam: int
    no_show: int
    durum_dagilimi: list[RaporDagilim]
    gunluk_adet: list[GunlukAdet]
    departman_dagilimi: list[RaporDagilim]


class ServisDolulukSatir(BaseModel):
    servis_id: int
    servis_adi: str
    dolu: int
    toplam: int
    oran: float = Field(ge=0.0, le=1.0)


class YatisRaporRead(BaseModel):
    aktif_yatis: int
    ortalama_los_gun: float
    servis_doluluk: list[ServisDolulukSatir]
    gunluk_yatis: list[GunlukAdet]


class YatakRaporRead(BaseModel):
    dolu: int
    bos: int
    temizlik_bekleyen: int
    arizali: int
    izolasyon_dagilimi: list[RaporDagilim]


class FinansRaporRead(BaseModel):
    fatura_toplam: int
    fatura_durum_dagilimi: list[RaporDagilim]
    toplam_tutar: Decimal
    doner_gelir: Decimal
    doner_gider: Decimal


class KlinikRaporRead(BaseModel):
    tetkik_durum_dagilimi: list[RaporDagilim]
    triyaj_renk_dagilimi: list[RaporDagilim]
    sikayet_bekleyen: int
    epikriz_onay_bekleyen: int
    no_show_hasta: int
