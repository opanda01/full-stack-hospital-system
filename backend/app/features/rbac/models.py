from typing import Optional

from sqlmodel import Field, Relationship, SQLModel

from app.core.base_model import BaseModel


class RolIzin(SQLModel, table=True):
    __tablename__ = "rol_izinler"

    rol_id: Optional[int] = Field(
        default=None, foreign_key="roller.id", primary_key=True
    )
    izin_id: Optional[int] = Field(
        default=None, foreign_key="izinler.id", primary_key=True
    )


class KullaniciRol(SQLModel, table=True):
    __tablename__ = "kullanici_roller"

    kullanici_id: Optional[int] = Field(
        default=None, foreign_key="kullanicilar.id", primary_key=True
    )
    rol_id: Optional[int] = Field(
        default=None, foreign_key="roller.id", primary_key=True
    )


class Rol(BaseModel, table=True):
    __tablename__ = "roller"

    kod: str = Field(max_length=50, unique=True, index=True)
    ad: str = Field(max_length=100)
    aciklama: Optional[str] = Field(default=None, max_length=255)
    sistem_mi: bool = Field(default=True)

    izinler: list["Izin"] = Relationship(back_populates="roller", link_model=RolIzin)
    kullanicilar: list["Kullanici"] = Relationship(  # noqa: F821
        back_populates="roller",
        link_model=KullaniciRol,
    )


class Izin(BaseModel, table=True):
    __tablename__ = "izinler"

    kod: str = Field(max_length=100, unique=True, index=True)
    ad: str = Field(max_length=100)
    kaynak: str = Field(max_length=50, index=True)

    roller: list[Rol] = Relationship(back_populates="izinler", link_model=RolIzin)
