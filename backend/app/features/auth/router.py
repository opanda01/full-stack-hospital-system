from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import get_current_user
from app.features.auth import service as auth_service
from app.features.auth.schemas import LoginRequest, RefreshRequest, TokenResponse
from app.features.kullanicilar.models import Kullanici
from app.features.kullanicilar.schemas import KullaniciRead

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, session: Session = Depends(get_session)) -> TokenResponse:
    return auth_service.login(session, body.email, body.sifre)


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    body: RefreshRequest, session: Session = Depends(get_session)
) -> TokenResponse:
    return auth_service.refresh(session, body.refresh_token)


@router.get("/me", response_model=KullaniciRead)
def me(current_user: Kullanici = Depends(get_current_user)) -> Kullanici:
    return current_user
