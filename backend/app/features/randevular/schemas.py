from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class RandevuCreate(BaseModel):
    hasta_id: UUID
    doktor_id: int
    departman_id: int
    tarih_saat: datetime
    notlar: str | None = None
    public_id: UUID | None = None


class RandevuRead(BaseModel):
    id: UUID
    hasta_id: UUID
    doktor_id: int
    departman_id: int
    tarih_saat: datetime
    durum: str
    notlar: str | None = None
    hasta_ad_soyad: str | None = None

    model_config = {"from_attributes": True}
