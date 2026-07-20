from datetime import date
from typing import Optional

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel


class NobetCizelgesi(BaseModel, table=True):
    __tablename__ = "nobet_cizelgesi"

    personel_id: int = Field(foreign_key="personel.id", index=True)
    tarih: date = Field(index=True)
    vardiya: str = Field(max_length=50)
    departman_id: int = Field(foreign_key="departmanlar.id", index=True)

    personel: Optional["Personel"] = Relationship(back_populates="nobetler")  # noqa: F821
    departman: Optional["Departman"] = Relationship(back_populates="nobetler")  # noqa: F821
