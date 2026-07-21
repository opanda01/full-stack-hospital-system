from datetime import date
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.core.enums import OtpAmac, OturumTipi, Rol


class LoginRequest(BaseModel):
    """kimlik (sicil / kullanici_adi / email) tercih edilir; email geriye uyum."""

    kimlik: str | None = None
    email: EmailStr | None = None
    sifre: str

    @model_validator(mode="after")
    def kimlik_veya_email(self) -> "LoginRequest":
        if not self.kimlik and not self.email:
            raise ValueError("kimlik veya email zorunludur")
        return self


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    rol: Rol | None = None
    permissions: list[str] = []
    oturum_tipi: OturumTipi = OturumTipi.PERSONEL
    sifre_degistirmeli_mi: bool = False
    kvkk_onaylandi_mi: bool = True


class RefreshRequest(BaseModel):
    refresh_token: str


class SifreDegistirRequest(BaseModel):
    eski_sifre: str
    yeni_sifre: str = Field(min_length=8)


class KvkkOnayRequest(BaseModel):
    onay: bool = True


class MeResponse(BaseModel):
    id: int
    email: Optional[EmailStr] = None
    ad: str
    soyad: str
    rol: Rol
    aktif_mi: bool
    kullanici_adi: Optional[str] = None
    sifre_degistirmeli_mi: bool = False
    kvkk_onaylandi_mi: bool = True

    model_config = {"from_attributes": True}


class LogoutRequest(BaseModel):
    refresh_token: str


class OtpGonderRequest(BaseModel):
    telefon: str = Field(min_length=10, max_length=20)
    tc_kimlik_no: str = Field(min_length=11, max_length=11)
    amac: OtpAmac
    ad: str | None = None
    soyad: str | None = None


class OtpGonderResponse(BaseModel):
    mesaj: str = "Doğrulama kodu gönderildi"
    son_kullanma_saniye: int


class OtpDogrulaRequest(BaseModel):
    telefon: str = Field(min_length=10, max_length=20)
    tc_kimlik_no: str = Field(min_length=11, max_length=11)
    kod: str = Field(min_length=6, max_length=6)
    amac: OtpAmac
    ad: str | None = None
    soyad: str | None = None
    kvkk_onay: bool | None = None


class DeprecatedRegisterResponse(BaseModel):
    """Eski hasta kayıt yanıtı + deprecation uyarısı."""

    id: int
    kullanici_id: int
    tc_kimlik_no: str
    dogum_tarihi: date | None = None
    cinsiyet: str | None = None
    kan_grubu: str | None = None
    adres: str | None = None
    uyari: str = (
        "Bu endpoint kullanımdan kaldırılacaktır. "
        "Lütfen OTP kayıt akışını (/auth/otp/gonder, /auth/otp/dogrula) kullanın."
    )

    model_config = {"from_attributes": True}
