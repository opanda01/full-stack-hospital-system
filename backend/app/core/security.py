import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated, Callable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session

from app.core.config import get_settings
from app.core.db import get_session
from app.core.enums import OturumTipi, Rol
from app.core.permissions import Kapsam, kapsam_getir
from app.features.kullanicilar.models import Kullanici

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Onboarding tamamlanmadan erişilebilir path'ler (method, path)
ONBOARDING_ALLOWLIST: frozenset[tuple[str, str]] = frozenset(
    {
        ("GET", "/auth/me"),
        ("POST", "/auth/sifre-degistir"),
        ("POST", "/auth/kvkk-onay"),
        ("POST", "/auth/logout"),
        ("POST", "/auth/refresh"),
    }
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str | None) -> bool:
    if not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def create_access_token(
    kullanici_id: int | str,
    rol: Rol | str | None = None,
    expires_delta: timedelta | None = None,
    extra_claims: dict | None = None,
    oturum_tipi: OturumTipi | str = OturumTipi.PERSONEL,
) -> str:
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + expires_delta
    ot = (
        oturum_tipi.value
        if isinstance(oturum_tipi, OturumTipi)
        else str(oturum_tipi)
    )
    payload: dict = {
        "sub": str(kullanici_id),
        "exp": expire,
        "type": "access",
        "oturum_tipi": ot,
    }
    if rol is not None:
        payload["rol"] = rol.value if isinstance(rol, Rol) else str(rol)
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token() -> str:
    """Opak, rastgele refresh token (JWT değil)."""
    return secrets.token_urlsafe(48)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def _oturum_tipi_from_payload(payload: dict) -> OturumTipi:
    raw = payload.get("oturum_tipi") or OturumTipi.PERSONEL.value
    try:
        return OturumTipi(raw)
    except ValueError:
        return OturumTipi.PERSONEL


def _onboarding_gerekli_mi(kullanici: Kullanici, oturum_tipi: OturumTipi) -> bool:
    if oturum_tipi != OturumTipi.PERSONEL:
        return False
    return bool(kullanici.sifre_degistirmeli_mi) or not bool(
        kullanici.kvkk_onaylandi_mi
    )


def _path_allowlisted(request: Request) -> bool:
    path = request.url.path.rstrip("/") or "/"
    # /auth/me trailing slash yok; normalize
    key = (request.method.upper(), path)
    if key in ONBOARDING_ALLOWLIST:
        return True
    # Bazı mount'lar trailing slash ile gelebilir
    alt = (request.method.upper(), path + "/")
    return alt in ONBOARDING_ALLOWLIST


async def get_current_user(
    request: Request,
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[Session, Depends(get_session)],
) -> Kullanici:
    payload = decode_access_token(token)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token geçersiz",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_id = int(sub)
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token geçersiz",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    kullanici = session.get(Kullanici, user_id)
    if kullanici is None or not kullanici.aktif_mi:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı veya pasif",
            headers={"WWW-Authenticate": "Bearer"},
        )

    oturum_tipi = _oturum_tipi_from_payload(payload)
    request.state.oturum_tipi = oturum_tipi
    request.state.token_payload = payload
    request.state.current_user = kullanici

    if _onboarding_gerekli_mi(kullanici, oturum_tipi) and not _path_allowlisted(
        request
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Önce şifre değiştirme ve KVKK onayı tamamlanmalı.",
        )

    return kullanici


async def get_current_user_payload(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> dict:
    payload = decode_access_token(token)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def effective_rol_for_request(
    request: Request, kullanici: Kullanici
) -> Rol:
    """Hasta oturumunda her zaman HASTA matrisi; aksi halde Kullanici.rol."""
    oturum = getattr(request.state, "oturum_tipi", None) or OturumTipi.PERSONEL
    if oturum == OturumTipi.HASTA:
        return Rol.HASTA
    rol = kullanici.rol
    return rol if isinstance(rol, Rol) else Rol(rol)


def require_role(*allowed_roles: Rol | str) -> Callable:
    """Basit rol guard — sahiplik gerektirmeyen endpoint'ler için."""
    normalized = {
        role.value if isinstance(role, Rol) else str(role) for role in allowed_roles
    }

    async def _dependency(
        request: Request,
        current_user: Annotated[Kullanici, Depends(get_current_user)],
    ) -> Kullanici:
        rol = effective_rol_for_request(request, current_user)
        if rol.value not in normalized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bu işlem için yetkiniz yok",
            )
        return current_user

    return _dependency


def require_permission(kaynak_aksiyon: str) -> Callable:
    """İzin matrisi + kapsam. request.state.kapsam / current_user yazar."""

    async def _checker(
        request: Request,
        current_user: Annotated[Kullanici, Depends(get_current_user)],
    ) -> Kullanici:
        rol = effective_rol_for_request(request, current_user)
        kapsam = kapsam_getir(rol, kaynak_aksiyon)
        if kapsam == Kapsam.YOK:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"'{kaynak_aksiyon}' işlemi için yetkiniz yok.",
            )
        request.state.kapsam = kapsam
        request.state.current_user = current_user
        return current_user

    return _checker
