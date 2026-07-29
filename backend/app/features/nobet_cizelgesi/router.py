from datetime import date

from fastapi import APIRouter, Depends, Query, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.pagination import Page, PaginationParams, get_pagination
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.nobet_cizelgesi import service as nobet_service
from app.features.nobet_cizelgesi.schemas import (
    NobetCizelgeEnsure,
    NobetCizelgeRead,
    NobetCreate,
    NobetRead,
    NobetUpdate,
)

router = APIRouter()


@router.get("/", response_model=Page[NobetRead])
def list_nobetler(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination),
    departman_id: int | None = Query(default=None),
    hafta_baslangic: date | None = Query(default=None),
    cizelge_id: int | None = Query(default=None),
    current_user: Kullanici = Depends(require_permission("nobet:goruntule")),
    session: Session = Depends(get_session),
):
    return nobet_service.list_nobetler(
        session,
        current_user,
        request.state.kapsam,
        departman_id=departman_id,
        hafta_baslangic=hafta_baslangic,
        cizelge_id=cizelge_id,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get("/cizelgeler", response_model=list[NobetCizelgeRead])
def list_cizelgeler(
    hafta_baslangic: date = Query(...),
    _user: Kullanici = Depends(require_permission("nobet:goruntule")),
    session: Session = Depends(get_session),
):
    return nobet_service.list_cizelgeler(session, hafta_baslangic=hafta_baslangic)


@router.post(
    "/cizelgeler/ensure",
    response_model=NobetCizelgeRead,
    status_code=status.HTTP_200_OK,
)
def ensure_cizelge(
    body: NobetCizelgeEnsure,
    _user=Depends(require_permission("nobet:olustur")),
    session: Session = Depends(get_session),
):
    return nobet_service.ensure_cizelge(session, body)


@router.post("/", response_model=NobetRead, status_code=status.HTTP_201_CREATED)
def create_nobet(
    body: NobetCreate,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("nobet:olustur")),
):
    return nobet_service.create_nobet(session, body)


@router.patch("/{nobet_id}", response_model=NobetRead)
def update_nobet(
    nobet_id: int,
    body: NobetUpdate,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("nobet:olustur")),
):
    return nobet_service.update_nobet(session, nobet_id, body)


@router.delete("/{nobet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nobet(
    nobet_id: int,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("nobet:olustur")),
):
    nobet_service.delete_nobet(session, nobet_id)
