from datetime import date, datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel


class Hasta(BaseModel, table=True):
    __tablename__ = "hastalar"

    public_id: UUID = Field(default_factory=uuid4, unique=True, index=True)
    kullanici_id: int = Field(foreign_key="kullanicilar.id", unique=True, index=True)
    tc_kimlik_no: str = Field(max_length=512, index=True)
    tc_kimlik_no_hash: Optional[str] = Field(default=None, max_length=128, unique=True, index=True)
    tc_kimlik_no_hash_prev: Optional[str] = Field(default=None, max_length=128, index=True)
    dogum_tarihi: Optional[date] = Field(default=None)
    cinsiyet: Optional[str] = Field(default=None, max_length=20)
    kan_grubu: Optional[str] = Field(default=None, max_length=10)
    adres: Optional[str] = Field(default=None, max_length=2000)
    boy_cm: Optional[float] = Field(default=None)
    kilo_kg: Optional[float] = Field(default=None)
    anonymized_at: Optional[datetime] = Field(default=None)

    kullanici: Optional["Kullanici"] = Relationship(back_populates="hasta")  # noqa: F821
    randevular: list["Randevu"] = Relationship(back_populates="hasta")  # noqa: F821
    tetkikler: list["Tetkik"] = Relationship(back_populates="hasta")  # noqa: F821
