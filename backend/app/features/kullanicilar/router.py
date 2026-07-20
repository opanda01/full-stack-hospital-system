from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.enums import Rol
from app.core.security import require_permission, require_role
from app.features.kullanicilar import service as kullanici_service
from app.features.kullanicilar.schemas import (
    KullaniciCreate,
    KullaniciRead,
    KullaniciUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[KullaniciRead])
def list_kullanicilar(
    session: Session = Depends(get_session),
    _user=Depends(require_role(Rol.ADMIN)),
):
    return kullanici_service.list_kullanicilar(session)


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
    _user=Depends(require_permission("kullanici:olustur")),
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


@router.delete("/{kullanici_id}", response_model=KullaniciRead)
def delete_kullanici(
    kullanici_id: int,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("kullanici:sil")),
):
    return kullanici_service.deactivate_kullanici(session, kullanici_id)
