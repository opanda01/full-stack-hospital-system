from fastapi import APIRouter, Depends, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.enums import OturumTipi, Rol
from app.core.pagination import Page, PaginationParams, get_pagination
from app.core.request_ip import istemci_ip_al
from app.core.security import require_permission, require_role
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


@router.get("/", response_model=Page[MuayeneRead])
def list_muayeneler(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination),
    current_user: Kullanici = Depends(require_permission("muayene:goruntule")),
    session: Session = Depends(get_session),
):
    return muayene_service.list_muayeneler(
        session,
        current_user,
        request.state.kapsam,
        page=pagination.page,
        page_size=pagination.page_size,
        oturum_tipi=getattr(request.state, "oturum_tipi", OturumTipi.PERSONEL),
    )


@router.get("/zorunlu-bildirimler", response_model=list[MuayeneRead])
def list_zorunlu_bildirimler(
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(
        require_role(Rol.ADMIN, Rol.BASHEKIM, Rol.MUDUR)
    ),
):
    return muayene_service.list_zorunlu_bildirimler(session)


@router.post("/{muayene_id}/zorunlu-bildirim-gonder")
def zorunlu_bildirim_gonder(
    muayene_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(
        require_role(Rol.ADMIN, Rol.BASHEKIM, Rol.MUDUR)
    ),
):
    ref = muayene_service.zorunlu_bildirim_mock_gonder(
        session,
        muayene_id,
        actor_id=current_user.id,
        ip_adresi=istemci_ip_al(request),
    )
    return {"dis_referans": ref, "durum": "GONDERILDI"}


@router.get("/{muayene_id}", response_model=MuayeneRead)
def get_muayene(
    muayene_id: int,
    request: Request,
    current_user: Kullanici = Depends(require_permission("muayene:goruntule")),
    session: Session = Depends(get_session),
):
    kayit = muayene_service.get_muayene(
        session,
        current_user,
        muayene_id,
        request.state.kapsam,
        oturum_tipi=getattr(request.state, "oturum_tipi", OturumTipi.PERSONEL),
    )
    return muayene_service.muayene_to_read(session, kayit)
