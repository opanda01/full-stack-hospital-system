from typing import Optional

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel


class MuayeneKaydi(BaseModel, table=True):
    __tablename__ = "muayene_kayitlari"

    randevu_id: int = Field(foreign_key="randevular.id", unique=True, index=True)
    tani: Optional[str] = Field(default=None, max_length=2000)
    tedavi_plani: Optional[str] = Field(default=None, max_length=2000)
    receteler: Optional[str] = Field(default=None, max_length=2000)

    randevu: Optional["Randevu"] = Relationship(back_populates="muayene")  # noqa: F821
