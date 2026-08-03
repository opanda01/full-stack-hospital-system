from fastapi import APIRouter, Depends, Request
from sqlmodel import Session

from app.core.db import get_session
from app.core.permissions import Kapsam
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.yatak_yonetimi import service as yatak_service
from app.features.yatak_yonetimi.schemas import (
    ServisDolulukOzet,
    ServisOku,
    YatakAtaIstek,
    YatakOku,
)

router = APIRouter()


@router.get("/servisler", response_model=list[ServisOku])
def get_servisler(
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("servis:goruntule")),
):
    kapsam: Kapsam = request.state.kapsam
    return yatak_service.list_servisler(session, kapsam=kapsam, current_user=current_user)


@router.get("/servisler/{servis_id}/yataklar", response_model=list[YatakOku])
def get_servis_yataklari(
    servis_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("yatak:goruntule")),
):
    kapsam: Kapsam = request.state.kapsam
    return yatak_service.list_servis_yataklari(
        session, servis_id, kapsam=kapsam, current_user=current_user
    )


@router.get("/servisler/{servis_id}/doluluk", response_model=ServisDolulukOzet)
def get_servis_doluluk(
    servis_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("servis:goruntule")),
):
    kapsam: Kapsam = request.state.kapsam
    return yatak_service.servis_doluluk_ozeti(
        session, servis_id, kapsam=kapsam, current_user=current_user
    )


@router.get("/yataklar/{yatak_id}", response_model=YatakOku)
def get_yatak(
    yatak_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("yatak:goruntule")),
):
    kapsam: Kapsam = request.state.kapsam
    return yatak_service.get_yatak(
        session, yatak_id, kapsam=kapsam, current_user=current_user
    )


@router.post("/yataklar/{yatak_id}/ata", response_model=YatakOku)
def post_yatak_ata(
    yatak_id: int,
    body: YatakAtaIstek,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("yatak:ata")),
):
    kapsam: Kapsam = request.state.kapsam
    return yatak_service.yatak_ata(
        session,
        yatak_id,
        body.yatis_id,
        kapsam=kapsam,
        current_user=current_user,
    )


@router.post("/yataklar/{yatak_id}/bosalt", response_model=YatakOku)
def post_yatak_bosalt(
    yatak_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("yatak:durum_guncelle")),
):
    kapsam: Kapsam = request.state.kapsam
    return yatak_service.yatak_bosalt(
        session, yatak_id, kapsam=kapsam, current_user=current_user
    )
