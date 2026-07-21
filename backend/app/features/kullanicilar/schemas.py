from typing import Optional

from pydantic import BaseModel, EmailStr

from app.core.enums import Rol


class KullaniciCreate(BaseModel):
    tc_kimlik_no: str
    ad: str
    soyad: str
    email: EmailStr
    telefon: str | None = None
    sifre: str
    rol: Rol = Rol.HASTA


class KullaniciRead(BaseModel):
    id: int
    tc_kimlik_no: str
    ad: str
    soyad: str
    email: Optional[str] = None
    telefon: str | None = None
    kullanici_adi: Optional[str] = None
    rol: Rol
    aktif_mi: bool
    sifre_degistirmeli_mi: bool = False
    kvkk_onaylandi_mi: bool = True

    model_config = {"from_attributes": True}


class KullaniciUpdate(BaseModel):
    ad: str | None = None
    soyad: str | None = None
    email: EmailStr | None = None
    telefon: str | None = None
    aktif_mi: bool | None = None
    rol: Rol | None = None


class KullaniciRolUpdate(BaseModel):
    rol: Rol


class KullaniciDurumUpdate(BaseModel):
    aktif_mi: bool
