from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class SikayetKaynak(str, Enum):
    HASTA = "HASTA"
    DOKTOR = "DOKTOR"
    PERSONEL = "PERSONEL"


class SikayetSiralama(str, Enum):
    YENI_ONCE = "yeni_once"
    ESKI_ONCE = "eski_once"


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
