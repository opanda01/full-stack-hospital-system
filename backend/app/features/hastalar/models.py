from datetime import date
from typing import Optional

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel


class Hasta(BaseModel, table=True):
    __tablename__ = "hastalar"

    kullanici_id: int = Field(foreign_key="kullanicilar.id", unique=True, index=True)
    tc_kimlik_no: str = Field(max_length=11, unique=True, index=True)
    dogum_tarihi: Optional[date] = Field(default=None)
    cinsiyet: Optional[str] = Field(default=None, max_length=20)
    kan_grubu: Optional[str] = Field(default=None, max_length=10)
    adres: Optional[str] = Field(default=None, max_length=500)

    kullanici: Optional["Kullanici"] = Relationship(back_populates="hasta")  # noqa: F821
    randevular: list["Randevu"] = Relationship(back_populates="hasta")  # noqa: F821
    tetkikler: list["Tetkik"] = Relationship(back_populates="hasta")  # noqa: F821
