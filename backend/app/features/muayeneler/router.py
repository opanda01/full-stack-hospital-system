from fastapi import APIRouter, Depends, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.request_ip import istemci_ip_al
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.muayeneler import service as muayene_service
from app.features.muayeneler.schemas import MuayeneCreate, MuayeneRead, MuayeneUpdate

router = APIRouter()


@router.post("/", response_model=MuayeneRead, status_code=status.HTTP_201_CREATED)
def create_muayene(
    body: MuayeneCreate,
    request: Request,
    current_user: Kullanici = Depends(require_permission("muayene:olustur")),
    session: Session = Depends(get_session),
):
    kayit = muayene_service.create_muayene(
        session,
        current_user,
        body,
        request.state.kapsam,
        ip_adresi=istemci_ip_al(request),
    )
    return muayene_service.muayene_to_read(session, kayit)


@router.patch("/{muayene_id}", response_model=MuayeneRead)
def update_muayene(
    muayene_id: int,
    body: MuayeneUpdate,
    request: Request,
    current_user: Kullanici = Depends(require_permission("muayene:guncelle")),
    session: Session = Depends(get_session),
):
    kayit = muayene_service.update_muayene(
        session,
        current_user,
        muayene_id,
        body,
        request.state.kapsam,
        ip_adresi=istemci_ip_al(request),
    )
    return muayene_service.muayene_to_read(session, kayit)


@router.get("/", response_model=list[MuayeneRead])
def list_muayeneler(
    request: Request,
    current_user: Kullanici = Depends(require_permission("muayene:goruntule")),
    session: Session = Depends(get_session),
):
    rows = muayene_service.list_muayeneler(
        session, current_user, request.state.kapsam
    )
    return [muayene_service.muayene_to_read(session, r) for r in rows]
