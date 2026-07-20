from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.enums import Rol
from app.core.security import require_role
from app.features.kullanicilar import service as kullanici_service
from app.features.kullanicilar.schemas import (
    KullaniciCreate,
    KullaniciDurumUpdate,
    KullaniciRead,
    KullaniciRolUpdate,
    KullaniciUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[KullaniciRead])
def list_kullanicilar(
    rol: Rol | None = Query(default=None),
    session: Session = Depends(get_session),
    _user=Depends(require_role(Rol.ADMIN, Rol.BASHEKIM, Rol.MUDUR)),
):
    return kullanici_service.list_kullanicilar(session, rol=rol)


@router.get("/{kullanici_id}", response_model=KullaniciRead)
def get_kullanici(
    kullanici_id: int,
    session: Session = Depends(get_session),
    _user=Depends(require_role(Rol.ADMIN)),
):
    return kullanici_service.get_kullanici(session, kullanici_id)


@router.post("/", response_model=KullaniciRead, status_code=status.HTTP_201_CREATED)
def create_kullanici(
    body: KullaniciCreate,
    session: Session = Depends(get_session),
    _user=Depends(require_role(Rol.ADMIN)),
):
    return kullanici_service.create_kullanici(session, body)


@router.patch("/{kullanici_id}", response_model=KullaniciRead)
def update_kullanici(
    kullanici_id: int,
    body: KullaniciUpdate,
    session: Session = Depends(get_session),
    _user=Depends(require_role(Rol.ADMIN)),
):
    return kullanici_service.update_kullanici(session, kullanici_id, body)


@router.patch("/{kullanici_id}/rol", response_model=KullaniciRead)
def patch_kullanici_rol(
    kullanici_id: int,
    body: KullaniciRolUpdate,
    session: Session = Depends(get_session),
    _user=Depends(require_role(Rol.ADMIN)),
):
    return kullanici_service.set_rol(session, kullanici_id, body.rol)


@router.patch("/{kullanici_id}/durum", response_model=KullaniciRead)
def patch_kullanici_durum(
    kullanici_id: int,
    body: KullaniciDurumUpdate,
    session: Session = Depends(get_session),
    _user=Depends(require_role(Rol.ADMIN)),
):
    return kullanici_service.set_durum(session, kullanici_id, body.aktif_mi)


@router.delete("/{kullanici_id}", response_model=KullaniciRead)
def delete_kullanici(
    kullanici_id: int,
    session: Session = Depends(get_session),
    _user=Depends(require_role(Rol.ADMIN)),
):
    return kullanici_service.deactivate_kullanici(session, kullanici_id)
