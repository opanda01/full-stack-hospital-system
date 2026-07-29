from datetime import date

from pydantic import BaseModel, Field


class NobetCreate(BaseModel):
    personel_id: int
    tarih: date
    vardiya: str
    departman_id: int
    cizelge_id: int | None = None
    sira: int = Field(default=0, ge=0, le=20)


class NobetUpdate(BaseModel):
    personel_id: int | None = None
    tarih: date | None = None
    vardiya: str | None = None
    departman_id: int | None = None
    sira: int | None = Field(default=None, ge=0, le=20)


class NobetRead(BaseModel):
    id: int
    personel_id: int
    personel_ad_soyad: str | None = None
    tarih: date
    vardiya: str
    departman_id: int
    departman_ad: str | None = None
    cizelge_id: int | None = None
    sira: int = 0

    model_config = {"from_attributes": True}


class NobetCizelgeRead(BaseModel):
    id: int
    departman_id: int
    departman_ad: str | None = None
    hafta_baslangic: date
    baslik: str | None = None

    model_config = {"from_attributes": True}


class NobetCizelgeEnsure(BaseModel):
    departman_id: int
    hafta_baslangic: date
