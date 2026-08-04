from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.core.tc_kimlik import TcKimlikNo


class HastaCreate(BaseModel):
    kullanici_id: int
    tc_kimlik_no: TcKimlikNo
    dogum_tarihi: date | None = None
    cinsiyet: str | None = None
    kan_grubu: str | None = None
    adres: str | None = None
    boy_cm: float | None = Field(default=None, ge=50, le=250)
    kilo_kg: float | None = Field(default=None, ge=2, le=500)
    public_id: UUID | None = None


class HastaCreateWithUser(BaseModel):
    tc_kimlik_no: TcKimlikNo
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
    email: str | None = None
    telefon: str | None = None
    aktif_mi: bool | None = None

    model_config = {"from_attributes": True}


class HastaUpdate(BaseModel):
    dogum_tarihi: date | None = None
    cinsiyet: str | None = None
    kan_grubu: str | None = None
    adres: str | None = None
    boy_cm: float | None = Field(default=None, ge=50, le=250)
    kilo_kg: float | None = Field(default=None, ge=2, le=500)
    ehliyet_kisitli_mi: bool | None = None


class HastaProfilUpdate(BaseModel):
    """Hasta kendi profilini günceller (e-Nabız tarzı)."""

    dogum_tarihi: date | None = None
    cinsiyet: str | None = None
    kan_grubu: str | None = None
    adres: str | None = None
    boy_cm: float | None = Field(default=None, ge=50, le=250)
    kilo_kg: float | None = Field(default=None, ge=2, le=500)
    telefon: str | None = Field(default=None, min_length=10, max_length=20)


class MukerrerIstegiCreate(BaseModel):
    kaynak_hasta_id: UUID
    hedef_hasta_id: UUID
    gerekce: str = Field(min_length=10, max_length=1000)


class MukerrerIstegiRead(BaseModel):
    id: int
    kaynak_hasta_id: UUID | None
    hedef_hasta_id: UUID | None
    durum: str
    gerekce: str
    olusturan_id: int
    onaylayan_id: int | None = None
    karar_tarihi: datetime | None = None


class YasalTemsilciCreate(BaseModel):
    tur: str = Field(default="VELI", pattern="^(VELI|VASI|YASAL_TEMSILCI)$")
    ad_soyad: str = Field(min_length=2, max_length=200)
    tc_kimlik_no: TcKimlikNo | None = None
    telefon: str | None = Field(default=None, max_length=20)
    yakinlik: str | None = Field(default=None, max_length=80)


class YasalTemsilciRead(BaseModel):
    id: int
    hasta_id: int
    tur: str
    ad_soyad: str
    tc_kimlik_no: str | None = None
    telefon: str | None = None
    yakinlik: str | None = None
    aktif_mi: bool = True

    model_config = {"from_attributes": True}
