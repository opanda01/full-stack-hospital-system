from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.enums import Rol
from app.core.lookups import hasta_getir
from app.core.security import get_current_user, require_permission, require_role
from app.features.bashekim.router import phi_goruntuleme_logla
from app.features.hastalar import service as hasta_service
from app.features.hastalar.schemas import (
    HastaCreateWithUser,
    HastaRead,
    HastaUpdate,
)
from app.features.kullanicilar.models import Kullanici

router = APIRouter()


@router.get("/ben", response_model=HastaRead)
def benim_hasta_kaydim(
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(get_current_user),
):
    h = hasta_getir(session, current_user.id)
    return hasta_service._hasta_to_read(session, h)


@router.get("/benim", response_model=list[HastaRead])
def list_benim_hastalar(
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("hasta:goruntule")),
):
    return hasta_service.list_benim_hastalar(
        session, current_user, request.state.kapsam
    )


@router.get("/", response_model=list[HastaRead])
def list_hastalar(
    q: str | None = None,
    kapsam: str | None = None,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(
        require_role(
            Rol.ADMIN,
            Rol.BASHEKIM,
            Rol.MUDUR,
            Rol.HEMSIRE,
            Rol.EBE,
            Rol.IDARI_PERSONEL,
        )
    ),
):
    if q or kapsam:
        return hasta_service.search_hastalar(
            session, current_user, q=q, kapsam_filtre=kapsam
        )
    return [
        hasta_service._hasta_to_read(session, h)
        for h in hasta_service.list_hastalar(session)
    ]


@router.get("/{hasta_id}", response_model=HastaRead)
def get_hasta(
    hasta_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("hasta:goruntule")),
):
    hasta = hasta_service.get_hasta_scoped(
        session, current_user, hasta_id, request.state.kapsam
    )
    phi_goruntuleme_logla(
        session,
        actor=current_user,
        kaynak="hasta",
        kaynak_id=hasta_id,
        request=request,
    )
    return hasta


@router.post("/", response_model=HastaRead, status_code=status.HTTP_201_CREATED)
def create_hasta(
    body: HastaCreateWithUser,
    session: Session = Depends(get_session),
    _user=Depends(require_role(Rol.ADMIN, Rol.IDARI_PERSONEL)),
):
    h = hasta_service.create_hasta_with_user(session, body)
    return hasta_service._hasta_to_read(session, h)


@router.patch("/{hasta_id}", response_model=HastaRead)
def update_hasta(
    hasta_id: int,
    body: HastaUpdate,
    session: Session = Depends(get_session),
    _user=Depends(require_role(Rol.ADMIN, Rol.IDARI_PERSONEL)),
):
    h = hasta_service.update_hasta(session, hasta_id, body)
    return hasta_service._hasta_to_read(session, h)
