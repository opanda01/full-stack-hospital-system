from typing import Optional

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel


class Tetkik(BaseModel, table=True):
    __tablename__ = "tetkikler"

    hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    istek_yapan_doktor_id: int = Field(foreign_key="doktorlar.id", index=True)
    tetkik_turu: str = Field(max_length=150)
    sonuc_dosyasi: Optional[str] = Field(default=None, max_length=500)
    durum: str = Field(default="ISTEK_ALINDI", max_length=50, index=True)

    hasta: Optional["Hasta"] = Relationship(back_populates="tetkikler")  # noqa: F821
    istek_yapan_doktor: Optional["Doktor"] = Relationship(back_populates="tetkikler")  # noqa: F821
