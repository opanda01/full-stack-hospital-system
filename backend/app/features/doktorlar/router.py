from fastapi import APIRouter, Depends, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import require_permission
from app.features.doktorlar import service as doktor_service
from app.features.doktorlar.schemas import DoktorCreate, DoktorRead, DoktorUpdate
from app.features.kullanicilar.models import Kullanici

router = APIRouter()


@router.get("/", response_model=list[DoktorRead])
def list_doktorlar(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("departman:goruntule")),
):
    return doktor_service.list_doktorlar(session)


@router.get("/ben", response_model=DoktorRead)
def benim_profilim(
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("doktor:profil_duzenle")),
):
    return doktor_service.get_benim_profilim(session, current_user)


@router.post("/", response_model=DoktorRead, status_code=status.HTTP_201_CREATED)
def create_doktor(
    body: DoktorCreate,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("doktor:profil_duzenle")),
):
    return doktor_service.create_doktor(session, body)


@router.patch("/{doktor_id}", response_model=DoktorRead)
def update_doktor(
    doktor_id: int,
    body: DoktorUpdate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("doktor:profil_duzenle")),
):
    return doktor_service.update_doktor(
        session, doktor_id, body, current_user, request.state.kapsam
    )
