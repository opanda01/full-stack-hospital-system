from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.config import get_settings
from app.core.enums import Rol
from app.core.permissions import rol_izin_kodlari
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.features.auth.models import RefreshToken
from app.features.auth.schemas import TokenResponse
from app.features.kullanicilar.models import Kullanici

settings = get_settings()


def _rol_value(kullanici: Kullanici) -> Rol:
    return kullanici.rol if isinstance(kullanici.rol, Rol) else Rol(kullanici.rol)


def _issue_tokens(session: Session, kullanici: Kullanici) -> TokenResponse:
    rol = _rol_value(kullanici)
    access = create_access_token(kullanici.id, rol)
    raw_refresh = create_refresh_token()
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    session.add(
        RefreshToken(
            kullanici_id=kullanici.id,
            token_hash=hash_token(raw_refresh),
            olusturma_tarihi=now,
            son_kullanma_tarihi=expires,
            iptal_edildi_mi=False,
        )
    )
    session.commit()
    return TokenResponse(
        access_token=access,
        refresh_token=raw_refresh,
        rol=rol,
        permissions=rol_izin_kodlari(rol),
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
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız pasif durumda",
        )
    return _issue_tokens(session, kullanici)


def refresh(session: Session, refresh_token: str) -> TokenResponse:
    token_row = session.exec(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_token(refresh_token)
        )
    ).first()
    if token_row is None or token_row.iptal_edildi_mi:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya iptal edilmiş refresh token",
        )

    now = datetime.now(timezone.utc)
    expires = token_row.son_kullanma_tarihi
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now:
        token_row.iptal_edildi_mi = True
        session.add(token_row)
        session.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token süresi dolmuş",
        )

    kullanici = session.get(Kullanici, token_row.kullanici_id)
    if kullanici is None or not kullanici.aktif_mi:
        token_row.iptal_edildi_mi = True
        session.add(token_row)
        session.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı veya pasif",
        )

    # Rotate: eskiyi iptal et, yeniyi oluştur
    token_row.iptal_edildi_mi = True
    session.add(token_row)
    session.flush()
    return _issue_tokens(session, kullanici)


def logout(session: Session, refresh_token: str) -> None:
    token_row = session.exec(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_token(refresh_token)
        )
    ).first()
    if token_row is None:
        return
    token_row.iptal_edildi_mi = True
    session.add(token_row)
    session.commit()


def sifre_degistir(
    session: Session,
    kullanici: Kullanici,
    eski_sifre: str,
    yeni_sifre: str,
) -> None:
    if not verify_password(eski_sifre, kullanici.sifre_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Eski şifre hatalı",
        )
    kullanici.sifre_hash = hash_password(yeni_sifre)
    session.add(kullanici)

    tokens = session.exec(
        select(RefreshToken).where(
            RefreshToken.kullanici_id == kullanici.id,
            RefreshToken.iptal_edildi_mi == False,  # noqa: E712
        )
    ).all()
    for row in tokens:
        row.iptal_edildi_mi = True
        session.add(row)
    session.commit()
