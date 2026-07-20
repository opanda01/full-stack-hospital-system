from typing import Optional

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel


class Departman(BaseModel, table=True):
    __tablename__ = "departmanlar"

    ad: str = Field(max_length=150, unique=True, index=True)
    kategori: Optional[str] = Field(default=None, max_length=100)
    aciklama: Optional[str] = Field(default=None, max_length=1000)
    kat_no: Optional[int] = Field(default=None)

    personeller: list["Personel"] = Relationship(back_populates="departman")  # noqa: F821
    randevular: list["Randevu"] = Relationship(back_populates="departman")  # noqa: F821
    nobetler: list["NobetCizelgesi"] = Relationship(back_populates="departman")  # noqa: F821
