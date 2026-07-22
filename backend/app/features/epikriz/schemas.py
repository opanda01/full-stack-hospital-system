from datetime import datetime

from pydantic import BaseModel


class EpikrizCreate(BaseModel):
    yatis_id: int
    sikayet_oyku: str | None = None
    fizik_muayene: str | None = None
    tani: str | None = None
    tedavi_ozeti: str | None = None
    taburcu_onerileri: str | None = None


class EpikrizUpdate(BaseModel):
    sikayet_oyku: str | None = None
    fizik_muayene: str | None = None
    tani: str | None = None
    tedavi_ozeti: str | None = None
    taburcu_onerileri: str | None = None


class EpikrizRead(BaseModel):
    id: int
    yatis_id: int
    hasta_id: int
    yazar_id: int
    durum: str
    sikayet_oyku: str | None = None
    fizik_muayene: str | None = None
    tani: str | None = None
    tedavi_ozeti: str | None = None
    taburcu_onerileri: str | None = None
    onaylayan_doktor_id: int | None = None
    onaylandi_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
