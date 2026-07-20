from pydantic import BaseModel, EmailStr

from app.core.enums import Rol


class LoginRequest(BaseModel):
    email: EmailStr
    sifre: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str | None = None
    rol: Rol


class RefreshRequest(BaseModel):
    refresh_token: str
