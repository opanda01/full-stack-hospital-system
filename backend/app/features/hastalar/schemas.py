from datetime import date

from pydantic import BaseModel, EmailStr


class HastaCreate(BaseModel):
    kullanici_id: int
    tc_kimlik_no: str
    dogum_tarihi: date | None = None
    cinsiyet: str | None = None
    kan_grubu: str | None = None
    adres: str | None = None


class HastaCreateWithUser(BaseModel):
    tc_kimlik_no: str
    ad: str
    soyad: str
    email: EmailStr
    sifre: str
    telefon: str | None = None
    dogum_tarihi: date | None = None
    cinsiyet: str | None = None
    kan_grubu: str | None = None
    adres: str | None = None


class HastaRead(BaseModel):
    id: int
    kullanici_id: int
    tc_kimlik_no: str
    dogum_tarihi: date | None = None
    cinsiyet: str | None = None
    kan_grubu: str | None = None
    adres: str | None = None

    model_config = {"from_attributes": True}


class HastaUpdate(BaseModel):
    dogum_tarihi: date | None = None
    cinsiyet: str | None = None
    kan_grubu: str | None = None
    adres: str | None = None
