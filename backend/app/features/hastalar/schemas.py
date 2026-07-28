from datetime import date
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class HastaCreate(BaseModel):
    kullanici_id: int
    tc_kimlik_no: str
    dogum_tarihi: date | None = None
    cinsiyet: str | None = None
    kan_grubu: str | None = None
    adres: str | None = None
    boy_cm: float | None = Field(default=None, ge=50, le=250)
    kilo_kg: float | None = Field(default=None, ge=2, le=500)
    public_id: UUID | None = None


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
    boy_cm: float | None = Field(default=None, ge=50, le=250)
    kilo_kg: float | None = Field(default=None, ge=2, le=500)
    public_id: UUID | None = None


class HastaRead(BaseModel):
    id: UUID
    kullanici_id: int
    tc_kimlik_no: str
    dogum_tarihi: date | None = None
    cinsiyet: str | None = None
    kan_grubu: str | None = None
    adres: str | None = None
    boy_cm: float | None = None
    kilo_kg: float | None = None
    ad: str | None = None
    soyad: str | None = None
    telefon: str | None = None

    model_config = {"from_attributes": True}


class HastaUpdate(BaseModel):
    dogum_tarihi: date | None = None
    cinsiyet: str | None = None
    kan_grubu: str | None = None
    adres: str | None = None
    boy_cm: float | None = Field(default=None, ge=50, le=250)
    kilo_kg: float | None = Field(default=None, ge=2, le=500)


class HastaProfilUpdate(BaseModel):
    """Hasta kendi profilini günceller (e-Nabız tarzı)."""

    dogum_tarihi: date | None = None
    cinsiyet: str | None = None
    kan_grubu: str | None = None
    adres: str | None = None
    boy_cm: float | None = Field(default=None, ge=50, le=250)
    kilo_kg: float | None = Field(default=None, ge=2, le=500)
    telefon: str | None = Field(default=None, min_length=10, max_length=20)
