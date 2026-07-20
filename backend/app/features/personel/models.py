from typing import Optional

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel
from app.core.enums import YonetimGorevi


class Personel(BaseModel, table=True):
    __tablename__ = "personel"

    kullanici_id: int = Field(foreign_key="kullanicilar.id", unique=True, index=True)
    sicil_no: str = Field(max_length=50, unique=True, index=True)
    departman_id: Optional[int] = Field(
        default=None, foreign_key="departmanlar.id", index=True
    )
    unvan: Optional[str] = Field(default=None, max_length=100)
    amir_id: Optional[int] = Field(default=None, foreign_key="personel.id", index=True)
    yonetim_gorevi: YonetimGorevi = Field(
        default=YonetimGorevi.YOK,
        index=True,
    )

    kullanici: Optional["Kullanici"] = Relationship(back_populates="personel")  # noqa: F821
    departman: Optional["Departman"] = Relationship(back_populates="personeller")  # noqa: F821
    amir: Optional["Personel"] = Relationship(
        back_populates="astlar",
        sa_relationship_kwargs={"remote_side": "Personel.id"},
    )
    astlar: list["Personel"] = Relationship(back_populates="amir")
    doktor: Optional["Doktor"] = Relationship(back_populates="personel")  # noqa: F821
    nobetler: list["NobetCizelgesi"] = Relationship(back_populates="personel")  # noqa: F821
    temizlik_gorevleri: list["TemizlikGorevi"] = Relationship(  # noqa: F821
        back_populates="personel",
        sa_relationship_kwargs={"foreign_keys": "TemizlikGorevi.personel_id"},
    )
