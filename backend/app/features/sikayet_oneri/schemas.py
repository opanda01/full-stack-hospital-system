from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class SikayetKaynak(str, Enum):
    HASTA = "HASTA"
    DOKTOR = "DOKTOR"
    PERSONEL = "PERSONEL"


class SikayetSiralama(str, Enum):
    YENI_ONCE = "yeni_once"
    ESKI_ONCE = "eski_once"


class SikayetDurum(str, Enum):
    ACIK = "ACIK"
    INCELENIYOR = "INCELENIYOR"
    COZULDU = "COZULDU"
    REDDEDILDI = "REDDEDILDI"


class SikayetDurumGuncelle(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    durum: SikayetDurum
    durum_notu: str | None = Field(default=None, max_length=500, alias="not")


class SikayetOzet(BaseModel):
    toplam: int
    bekleyen: int
    cozulen: int


class SikayetOneriCreate(BaseModel):
    tur: str = Field(max_length=50)
    icerik: str = Field(max_length=5000)


class SikayetOneriRead(BaseModel):
    id: int
    gonderen_kullanici_id: int
    gonderen_ad_soyad: str | None = None
    gonderen_rol: str | None = None
    kaynak_grubu: SikayetKaynak
    tur: str
    icerik: str
    tarih: datetime
    durum: str

    model_config = {"from_attributes": True}
