from typing import Optional

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel


class Birim(BaseModel, table=True):
    """Üst birim (Dahili, Cerrahi, Acil vb.) — departmanlar buna bağlanır."""

    __tablename__ = "birimler"

    ad: str = Field(max_length=150, unique=True, index=True)
    kod: Optional[str] = Field(default=None, max_length=50, unique=True, index=True)
    sira: int = Field(default=0, index=True)
    aciklama: Optional[str] = Field(default=None, max_length=500)

    departmanlar: list["Departman"] = Relationship(back_populates="birim")  # noqa: F821


class Departman(BaseModel, table=True):
    __tablename__ = "departmanlar"

    ad: str = Field(max_length=150, unique=True, index=True)
    kategori: Optional[str] = Field(default=None, max_length=100)
    aciklama: Optional[str] = Field(default=None, max_length=1000)
    kat_no: Optional[int] = Field(default=None)
    birim_id: Optional[int] = Field(
        default=None, foreign_key="birimler.id", index=True
    )

    birim: Optional[Birim] = Relationship(back_populates="departmanlar")
    personeller: list["Personel"] = Relationship(back_populates="departman")  # noqa: F821
    randevular: list["Randevu"] = Relationship(back_populates="departman")  # noqa: F821
    nobetler: list["NobetCizelgesi"] = Relationship(back_populates="departman")  # noqa: F821
