from datetime import datetime
from typing import Optional

from sqlmodel import Field, Relationship

from app.core.base_model import BaseModel
from app.core.enums import ErisimDurumu, PersonelKaynakTipi, Rol
from app.features.rbac.models import KullaniciRol, Rol as DbRol


class Kullanici(BaseModel, table=True):
    __tablename__ = "kullanicilar"

    tc_kimlik_no: str = Field(max_length=11, unique=True, index=True)
    ad: str = Field(max_length=100)
    soyad: str = Field(max_length=100)
    email: Optional[str] = Field(default=None, max_length=255, unique=True, index=True)
    telefon: Optional[str] = Field(default=None, max_length=20)
    kullanici_adi: Optional[str] = Field(
        default=None, max_length=100, unique=True, index=True
    )
    sifre_hash: Optional[str] = Field(default=None)
    rol: Rol = Field(default=Rol.HASTA, index=True)
    # Cache kolonu — yalnızca erisim_durumu transition ile yazılır
    aktif_mi: bool = Field(default=True)
    erisim_durumu: ErisimDurumu = Field(
        default=ErisimDurumu.ONAYLANDI, index=True
    )
    erisim_kaynak_tipi: PersonelKaynakTipi = Field(
        default=PersonelKaynakTipi.KURUM
    )
    erisim_firma_adi: Optional[str] = Field(default=None, max_length=255)
    erisim_red_gerekce: Optional[str] = Field(default=None, max_length=1000)
    erisim_onaylayan_id: Optional[int] = Field(default=None, index=True)
    erisim_onay_tarihi: Optional[datetime] = Field(default=None)
    sifre_degistirmeli_mi: bool = Field(default=False)
    kvkk_onaylandi_mi: bool = Field(default=True)
    kvkk_onay_tarihi: Optional[datetime] = Field(default=None)

    roller: list[DbRol] = Relationship(
        back_populates="kullanicilar",
        link_model=KullaniciRol,
    )
    personel: Optional["Personel"] = Relationship(back_populates="kullanici")  # noqa: F821
    hasta: Optional["Hasta"] = Relationship(back_populates="kullanici")  # noqa: F821
