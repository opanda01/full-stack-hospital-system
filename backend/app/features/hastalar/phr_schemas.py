from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from app.features.randevular.schemas import RandevuRead


class HastaBelgeRead(BaseModel):
    kaynak: Literal["EPIKRIZ", "KLINIK_ONAY"]
    id: int
    tur: str | None = None
    baslik: str
    ozet: str | None = None
    durum: str
    tarih: datetime | None = None


class HastaYatisOzetRead(BaseModel):
    aktif_mi: bool
    yatis_id: int | None = None
    protokol_no: str | None = None
    servis_adi: str | None = None
    yatak_no: str | None = None
    oda_no: str | None = None
    yatis_tarihi: datetime | None = None
    taburcu_tarihi: datetime | None = None


class HastaYatisGecmisRead(HastaYatisOzetRead):
    """Yatış geçmişi satırı — aktif ve taburcu kayıtlar."""


class HastaOzetRead(BaseModel):
    ad_soyad: str
    yaklasan_randevu: RandevuRead | None = None
    yaklasan_randevu_sayisi: int = 0
    son_tetkik_turu: str | None = None
    son_tetkik_durum: str | None = None
    son_tetkik_tarih: datetime | None = None
    okunmamis_sonuc_sayisi: int = 0
    yatis: HastaYatisOzetRead | None = None


class AktifIlacRead(BaseModel):
    urun_adi: str
    doz: str | None = None
    periyod: str | None = None
    muayene_id: int
    son_guncelleme: datetime | None = None


class AsiKaydiRead(BaseModel):
    id: int
    asi_adi: str
    uygulama_tarihi: date
    sonraki_tarih: date | None = None
    notlar: str | None = None
    uygulayan: str | None = None

    model_config = {"from_attributes": True}
