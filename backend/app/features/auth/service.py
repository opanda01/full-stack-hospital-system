from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.enums import Rol
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    verify_password,
)
from app.features.auth.schemas import TokenResponse
from app.features.kullanicilar.models import Kullanici


def _token_pair(kullanici: Kullanici) -> TokenResponse:
    rol = kullanici.rol if isinstance(kullanici.rol, Rol) else Rol(kullanici.rol)
    claims = {"rol": rol.value}
    return TokenResponse(
        access_token=create_access_token(str(kullanici.id), claims),
        refresh_token=create_refresh_token(str(kullanici.id), claims),
        rol=rol,
    )


def login(session: Session, email: str, sifre: str) -> TokenResponse:
    kullanici = session.exec(
        select(Kullanici).where(Kullanici.email == email)
    ).first()
    if kullanici is None or not verify_password(sifre, kullanici.sifre_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı",
        )
    if not kullanici.aktif_mi:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hesap pasif",
        )
    return _token_pair(kullanici)


def refresh(session: Session, refresh_token: str) -> TokenResponse:
    payload = decode_access_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz refresh token",
        )
    sub = payload.get("sub")
    try:
        user_id = int(sub)
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz refresh token",
        ) from exc
    kullanici = session.get(Kullanici, user_id)
    if kullanici is None or not kullanici.aktif_mi:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı veya pasif",
        )
    return _token_pair(kullanici)
