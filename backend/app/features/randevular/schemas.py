from datetime import datetime

from pydantic import BaseModel


class RandevuCreate(BaseModel):
    hasta_id: int
    doktor_id: int
    departman_id: int
    tarih_saat: datetime
    notlar: str | None = None


class RandevuRead(BaseModel):
    id: int
    hasta_id: int
    doktor_id: int
    departman_id: int
    tarih_saat: datetime
    durum: str
    notlar: str | None = None
    hasta_ad_soyad: str | None = None

    model_config = {"from_attributes": True}
