from datetime import datetime
from typing import Optional

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel


class Randevu(BaseModel, table=True):
    __tablename__ = "randevular"

    hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    doktor_id: int = Field(foreign_key="doktorlar.id", index=True)
    departman_id: int = Field(foreign_key="departmanlar.id", index=True)
    tarih_saat: datetime = Field(index=True)
    durum: str = Field(default="BEKLEMEDE", max_length=50, index=True)
    notlar: Optional[str] = Field(default=None, max_length=1000)

    hasta: Optional["Hasta"] = Relationship(back_populates="randevular")  # noqa: F821
    doktor: Optional["Doktor"] = Relationship(back_populates="randevular")  # noqa: F821
    departman: Optional["Departman"] = Relationship(back_populates="randevular")  # noqa: F821
    muayene: Optional["MuayeneKaydi"] = Relationship(back_populates="randevu")  # noqa: F821
