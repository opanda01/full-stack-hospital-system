from pydantic import BaseModel, EmailStr, Field

from app.core.enums import Rol


class LoginRequest(BaseModel):
    email: EmailStr
    sifre: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    rol: Rol | None = None
    permissions: list[str] = []


class RefreshRequest(BaseModel):
    refresh_token: str


class SifreDegistirRequest(BaseModel):
    eski_sifre: str
    yeni_sifre: str = Field(min_length=8)


class MeResponse(BaseModel):
    id: int
    email: EmailStr
    ad: str
    soyad: str
    rol: Rol
    aktif_mi: bool

    model_config = {"from_attributes": True}


class LogoutRequest(BaseModel):
    refresh_token: str
