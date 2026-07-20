from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import get_current_user
from app.features.auth import service as auth_service
from app.features.auth.schemas import (
    LoginRequest,
    LogoutRequest,
    MeResponse,
    RefreshRequest,
    SifreDegistirRequest,
    TokenResponse,
)
from app.features.hastalar import service as hasta_service
from app.features.hastalar.schemas import HastaCreateWithUser, HastaRead
from app.features.kullanicilar.models import Kullanici

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, session: Session = Depends(get_session)) -> TokenResponse:
    return auth_service.login(session, body.email, body.sifre)


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    body: RefreshRequest, session: Session = Depends(get_session)
) -> TokenResponse:
    return auth_service.refresh(session, body.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    body: LogoutRequest,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(get_current_user),
) -> None:
    auth_service.logout(session, body.refresh_token)


@router.post("/sifre-degistir", status_code=status.HTTP_204_NO_CONTENT)
def sifre_degistir(
    body: SifreDegistirRequest,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(get_current_user),
) -> None:
    auth_service.sifre_degistir(
        session, current_user, body.eski_sifre, body.yeni_sifre
    )


@router.post("/register", response_model=HastaRead, status_code=status.HTTP_201_CREATED)
def register_hasta(
    body: HastaCreateWithUser,
    session: Session = Depends(get_session),
):
    """Hasta self-registration (mobil / web)."""
    return hasta_service.create_hasta_with_user(session, body)


@router.get("/me", response_model=MeResponse)
def me(current_user: Kullanici = Depends(get_current_user)) -> Kullanici:
    return current_user
