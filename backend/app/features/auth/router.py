from fastapi import APIRouter, Depends, Request, Response, status
from sqlmodel import Session

from app.core.config import get_settings
from app.core.db import get_session
from app.core.request_ip import istemci_ip_al
from app.core.security import get_current_user
from app.features.auth import service as auth_service
from app.features.auth.schemas import (
    DeprecatedRegisterResponse,
    KvkkOnayRequest,
    LoginRequest,
    LogoutRequest,
    MeResponse,
    OtpDogrulaRequest,
    OtpGonderRequest,
    OtpGonderResponse,
    RefreshRequest,
    SifreDegistirRequest,
    TokenResponse,
)
from app.features.hastalar import service as hasta_service
from app.features.hastalar.schemas import HastaCreateWithUser
from app.features.kullanicilar.models import Kullanici

router = APIRouter()
settings = get_settings()


@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    request: Request,
    session: Session = Depends(get_session),
) -> TokenResponse:
    return auth_service.login(
        session,
        sifre=body.sifre,
        kimlik=body.kimlik,
        email=str(body.email) if body.email else None,
        ip_adresi=istemci_ip_al(request),
    )


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
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(get_current_user),
) -> None:
    auth_service.sifre_degistir(
        session,
        current_user,
        body.eski_sifre,
        body.yeni_sifre,
        ip_adresi=istemci_ip_al(request),
    )


@router.post("/kvkk-onay", response_model=MeResponse)
def kvkk_onay(
    body: KvkkOnayRequest,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(get_current_user),
) -> Kullanici:
    return auth_service.kvkk_onayla(
        session,
        current_user,
        onay=body.onay,
        ip_adresi=istemci_ip_al(request),
    )


@router.post("/otp/gonder", response_model=OtpGonderResponse)
def otp_gonder(
    body: OtpGonderRequest,
    request: Request,
    session: Session = Depends(get_session),
) -> OtpGonderResponse:
    return auth_service.otp_gonder(
        session,
        telefon=body.telefon,
        tc_kimlik_no=body.tc_kimlik_no,
        amac=body.amac,
        ip_adresi=istemci_ip_al(request),
    )


@router.post("/otp/dogrula", response_model=TokenResponse)
def otp_dogrula(
    body: OtpDogrulaRequest,
    request: Request,
    session: Session = Depends(get_session),
) -> TokenResponse:
    return auth_service.otp_dogrula(
        session,
        telefon=body.telefon,
        tc_kimlik_no=body.tc_kimlik_no,
        kod=body.kod,
        amac=body.amac,
        ad=body.ad,
        soyad=body.soyad,
        kvkk_onay=body.kvkk_onay,
        ip_adresi=istemci_ip_al(request),
    )


@router.post(
    "/register",
    response_model=DeprecatedRegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_hasta(
    body: HastaCreateWithUser,
    response: Response,
    session: Session = Depends(get_session),
):
    """Hasta self-registration (deprecated — OTP kullanın)."""
    response.headers["X-Deprecated"] = "true"
    response.headers["Sunset"] = settings.AUTH_REGISTER_SUNSET
    hasta = hasta_service.create_hasta_with_user(session, body)
    return DeprecatedRegisterResponse.model_validate(hasta)


@router.get("/me", response_model=MeResponse)
def me(current_user: Kullanici = Depends(get_current_user)) -> Kullanici:
    return current_user
