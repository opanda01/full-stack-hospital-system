from datetime import date

from fastapi import APIRouter, Depends, Query, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.pagination import Page, PaginationParams, get_pagination
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.temizlik_gorevleri import service as temizlik_service
from app.features.temizlik_gorevleri.schemas import (
    TemizlikGoreviCreate,
    TemizlikGoreviRead,
    TemizlikGoreviUpdate,
)

router = APIRouter()


@router.get("/", response_model=Page[TemizlikGoreviRead])
def list_gorevler(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination),
    hafta_baslangic: date | None = Query(default=None),
    current_user: Kullanici = Depends(require_permission("temizlik_gorevi:goruntule")),
    session: Session = Depends(get_session),
):
    return temizlik_service.listele(
        session,
        current_user,
        request.state.kapsam,
        hafta_baslangic=hafta_baslangic,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.post("/", response_model=TemizlikGoreviRead, status_code=status.HTTP_201_CREATED)
def create_gorev(
    body: TemizlikGoreviCreate,
    current_user: Kullanici = Depends(require_permission("temizlik_gorevi:ata")),
    session: Session = Depends(get_session),
):
    return temizlik_service.ata(session, current_user, body)


@router.patch("/{gorev_id}", response_model=TemizlikGoreviRead)
def update_gorev(
    gorev_id: int,
    body: TemizlikGoreviUpdate,
    current_user: Kullanici = Depends(require_permission("temizlik_gorevi:guncelle")),
    session: Session = Depends(get_session),
):
    return temizlik_service.guncelle(session, current_user, gorev_id, body)


@router.delete("/{gorev_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gorev(
    gorev_id: int,
    current_user: Kullanici = Depends(require_permission("temizlik_gorevi:ata")),
    session: Session = Depends(get_session),
):
    temizlik_service.sil(session, current_user, gorev_id)
