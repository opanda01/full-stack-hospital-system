from datetime import date
from typing import Optional

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel


class NobetDepartmanCizelgesi(BaseModel, table=True):
    """Departman + hafta bazlı nöbet tablosu başlığı."""

    __tablename__ = "nobet_departman_cizelgeleri"

    departman_id: int = Field(foreign_key="departmanlar.id", index=True)
    hafta_baslangic: date = Field(index=True)
    baslik: Optional[str] = Field(default=None, max_length=200)

    departman: Optional["Departman"] = Relationship(back_populates="nobet_cizelgeleri")  # noqa: F821
    nobetler: list["NobetCizelgesi"] = Relationship(back_populates="cizelge")


class NobetCizelgesi(BaseModel, table=True):
    __tablename__ = "nobet_cizelgesi"

    personel_id: int = Field(foreign_key="personel.id", index=True)
    tarih: date = Field(index=True)
    vardiya: str = Field(max_length=50)
    departman_id: int = Field(foreign_key="departmanlar.id", index=True)
    cizelge_id: Optional[int] = Field(
        default=None, foreign_key="nobet_departman_cizelgeleri.id", index=True
    )
    sira: int = Field(default=0)

    personel: Optional["Personel"] = Relationship(back_populates="nobetler")  # noqa: F821
    departman: Optional["Departman"] = Relationship(back_populates="nobetler")  # noqa: F821
    cizelge: Optional[NobetDepartmanCizelgesi] = Relationship(back_populates="nobetler")
