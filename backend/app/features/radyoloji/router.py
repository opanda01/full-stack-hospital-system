from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.pagination import Page, PaginationParams, get_pagination
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.radyoloji import orthanc_client
from app.features.radyoloji import service as radyoloji_service
from app.features.radyoloji.schemas import (
    RadyolojiGoruntuLink,
    RadyolojiIstemOlustur,
    RadyolojiIstemOku,
    RadyolojiRaporGir,
)

router = APIRouter()


@router.get("/orthanc/health")
def orthanc_health(
    _user: Kullanici = Depends(require_permission("radyoloji:goruntule")),
):
    return orthanc_client.orthanc_health()


@router.get("/istemler", response_model=Page[RadyolojiIstemOku])
def list_istemler(
    request: Request,
    hasta_id: UUID | None = None,
    pagination: PaginationParams = Depends(get_pagination),
    current_user: Kullanici = Depends(require_permission("radyoloji:goruntule")),
    session: Session = Depends(get_session),
):
    return radyoloji_service.listele(
        session,
        current_user,
        request.state.kapsam,
        hasta_public_id=hasta_id,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get("/istemler/{istem_id}", response_model=RadyolojiIstemOku)
def get_istem(
    istem_id: int,
    request: Request,
    current_user: Kullanici = Depends(require_permission("radyoloji:goruntule")),
    session: Session = Depends(get_session),
):
    from app.features.bashekim.router import phi_goruntuleme_logla

    row = radyoloji_service.getir(session, current_user, istem_id)
    phi_goruntuleme_logla(
        session,
        actor=current_user,
        kaynak="radyoloji",
        kaynak_id=istem_id,
        request=request,
        detay_extra={"radyoloji_istem_id": istem_id},
    )
    return row


@router.post(
    "/istemler",
    response_model=RadyolojiIstemOku,
    status_code=status.HTTP_201_CREATED,
)
def post_istem(
    body: RadyolojiIstemOlustur,
    request: Request,
    current_user: Kullanici = Depends(require_permission("radyoloji:iste")),
    session: Session = Depends(get_session),
):
    return radyoloji_service.radyoloji_istem_olustur(
        session, current_user, body, request.state.kapsam
    )


@router.post("/istemler/{istem_id}/rapor", response_model=RadyolojiIstemOku)
def post_rapor(
    istem_id: int,
    body: RadyolojiRaporGir,
    current_user: Kullanici = Depends(require_permission("radyoloji:sonuc_gir")),
    session: Session = Depends(get_session),
):
    return radyoloji_service.rapor_gir(session, current_user, istem_id, body)


@router.get("/istemler/{istem_id}/goruntu-linki", response_model=RadyolojiGoruntuLink)
def get_goruntu_linki(
    istem_id: int,
    current_user: Kullanici = Depends(require_permission("radyoloji:goruntule")),
    session: Session = Depends(get_session),
):
    return radyoloji_service.goruntu_linki(session, current_user, istem_id)
