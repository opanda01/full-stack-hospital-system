from typing import Optional

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel
from app.core.enums import Rol
from app.features.rbac.models import KullaniciRol, Rol as DbRol


class Kullanici(BaseModel, table=True):
    __tablename__ = "kullanicilar"

    tc_kimlik_no: str = Field(max_length=11, unique=True, index=True)
    ad: str = Field(max_length=100)
    soyad: str = Field(max_length=100)
    email: str = Field(max_length=255, unique=True, index=True)
    telefon: Optional[str] = Field(default=None, max_length=20)
    sifre_hash: str
    rol: Rol = Field(default=Rol.HASTA, index=True)
    aktif_mi: bool = Field(default=True)

    roller: list[DbRol] = Relationship(
        back_populates="kullanicilar",
        link_model=KullaniciRol,
    )
    personel: Optional["Personel"] = Relationship(back_populates="kullanici")  # noqa: F821
    hasta: Optional["Hasta"] = Relationship(back_populates="kullanici")  # noqa: F821
