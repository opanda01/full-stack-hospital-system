from fastapi import APIRouter, Depends, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.temizlik_gorevleri import service as temizlik_service
from app.features.temizlik_gorevleri.schemas import (
    TemizlikGoreviCreate,
    TemizlikGoreviRead,
    TemizlikGoreviUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[TemizlikGoreviRead])
def list_gorevler(
    request: Request,
    current_user: Kullanici = Depends(require_permission("temizlik_gorevi:goruntule")),
    session: Session = Depends(get_session),
):
    return temizlik_service.listele(session, current_user, request.state.kapsam)


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
