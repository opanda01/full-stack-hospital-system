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
    return hasta_getir(session, current_user.id)


@router.get("/", response_model=list[HastaRead])
def list_hastalar(
    session: Session = Depends(get_session),
    _user=Depends(
        require_role(
            Rol.ADMIN,
            Rol.BASHEKIM,
            Rol.MUDUR,
            Rol.DOKTOR,
            Rol.HEMSIRE,
            Rol.EBE,
            Rol.IDARI_PERSONEL,
        )
    ),
):
    return hasta_service.list_hastalar(session)


@router.get("/{hasta_id}", response_model=HastaRead)
def get_hasta(
    hasta_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("hasta:listele")),
):
    hasta = hasta_service.get_hasta(session, hasta_id)
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
    return hasta_service.create_hasta_with_user(session, body)


@router.patch("/{hasta_id}", response_model=HastaRead)
def update_hasta(
    hasta_id: int,
    body: HastaUpdate,
    session: Session = Depends(get_session),
    _user=Depends(require_role(Rol.ADMIN, Rol.IDARI_PERSONEL)),
):
    return hasta_service.update_hasta(session, hasta_id, body)
