from typing import Optional

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel


class Doktor(BaseModel, table=True):
    __tablename__ = "doktorlar"

    personel_id: int = Field(foreign_key="personel.id", unique=True, index=True)
    uzmanlik_alani: str = Field(max_length=150)
    diploma_no: str = Field(max_length=50, unique=True)
    online_randevu_acik_mi: bool = Field(default=True)

    personel: Optional["Personel"] = Relationship(back_populates="doktor")  # noqa: F821
    randevular: list["Randevu"] = Relationship(back_populates="doktor")  # noqa: F821
    tetkikler: list["Tetkik"] = Relationship(back_populates="istek_yapan_doktor")  # noqa: F821
