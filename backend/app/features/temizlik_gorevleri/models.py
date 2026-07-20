from datetime import date
from typing import Optional

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel


class TemizlikGorevi(BaseModel, table=True):
    __tablename__ = "temizlik_gorevleri"

    personel_id: int = Field(foreign_key="personel.id", index=True)
    oda_bolum: str = Field(max_length=150)
    gorev_tarihi: date = Field(index=True)
    durum: str = Field(default="ATANDI", max_length=50, index=True)
    onay_veren_id: Optional[int] = Field(default=None, foreign_key="personel.id", index=True)

    personel: Optional["Personel"] = Relationship(  # noqa: F821
        back_populates="temizlik_gorevleri",
        sa_relationship_kwargs={"foreign_keys": "TemizlikGorevi.personel_id"},
    )
    onay_veren: Optional["Personel"] = Relationship(  # noqa: F821
        sa_relationship_kwargs={"foreign_keys": "TemizlikGorevi.onay_veren_id"},
    )
