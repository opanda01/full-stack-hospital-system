from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.pagination import Page, PaginationParams, get_pagination
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.tetkikler import service as tetkik_service
from app.features.tetkikler.schemas import (
    TetkikCreate,
    TetkikRead,
    TetkikSonucUpdate,
    TetkikTrendNokta,
)

router = APIRouter()


@router.get("/", response_model=Page[TetkikRead])
def list_tetkikler(
    request: Request,
    hasta_id: UUID | None = None,
    pagination: PaginationParams = Depends(get_pagination),
    current_user: Kullanici = Depends(require_permission("tetkik:goruntule")),
    session: Session = Depends(get_session),
):
    return tetkik_service.listele(
        session,
        current_user,
        request.state.kapsam,
        hasta_public_id=hasta_id,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get("/trend", response_model=list[TetkikTrendNokta])
def tetkik_trend(
    hasta_id: UUID = Query(...),
    parametre: str = Query(..., min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: Kullanici = Depends(require_permission("tetkik:goruntule")),
    session: Session = Depends(get_session),
):
    return tetkik_service.trend(
        session,
        current_user,
        hasta_public_id=hasta_id,
        parametre=parametre,
        limit=limit,
    )


@router.get("/{public_id}", response_model=TetkikRead)
def get_tetkik(
    public_id: UUID,
    request: Request,
    current_user: Kullanici = Depends(require_permission("tetkik:goruntule")),
    session: Session = Depends(get_session),
):
    from app.features.bashekim.router import phi_goruntuleme_logla

    row = tetkik_service.getir(session, current_user, public_id)
    phi_goruntuleme_logla(
        session,
        actor=current_user,
        kaynak="tetkik",
        kaynak_id=row.id,
        request=request,
        detay_extra={"tetkik_public_id": str(row.public_id)},
    )
    tetkik_service.hasta_goruldu_isaretle(session, current_user, row)
    return tetkik_service._to_read(session, row)


@router.post("/", response_model=TetkikRead, status_code=status.HTTP_201_CREATED)
def create_tetkik(
    body: TetkikCreate,
    request: Request,
    current_user: Kullanici = Depends(require_permission("tetkik:iste")),
    session: Session = Depends(get_session),
):
    return tetkik_service.olustur(session, current_user, body, request.state.kapsam)


@router.patch("/{public_id}/sonuc", response_model=TetkikRead)
def tetkik_sonuc_gir(
    public_id: UUID,
    body: TetkikSonucUpdate,
    current_user: Kullanici = Depends(require_permission("tetkik:sonuc_gir")),
    session: Session = Depends(get_session),
):
    return tetkik_service.sonuc_gir(
        session,
        current_user,
        public_id,
        body.sonuc_dosyasi,
        body.durum,
        sonuc_kalemleri=body.sonuc_kalemleri,
    )
