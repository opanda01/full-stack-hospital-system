from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import require_permission
from app.features.epikriz import service as epikriz_service
from app.features.epikriz.schemas import EpikrizCreate, EpikrizRead, EpikrizUpdate
from app.features.kullanicilar.models import Kullanici

router = APIRouter()


@router.get("/", response_model=list[EpikrizRead])
def list_epikriz(
    yatis_id: int | None = Query(default=None),
    hasta_id: int | None = Query(default=None),
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("epikriz:goruntule")),
):
    return epikriz_service.list_epikriz(
        session, yatis_id=yatis_id, hasta_id=hasta_id
    )


@router.get("/{epikriz_id}", response_model=EpikrizRead)
def get_epikriz(
    epikriz_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("epikriz:goruntule")),
):
    return epikriz_service.get_epikriz(session, epikriz_id)


@router.post("/", response_model=EpikrizRead, status_code=201)
def create_epikriz(
    body: EpikrizCreate,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("epikriz:olustur")),
):
    return epikriz_service.create_epikriz(session, current_user, body)


@router.patch("/{epikriz_id}", response_model=EpikrizRead)
def update_epikriz(
    epikriz_id: int,
    body: EpikrizUpdate,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("epikriz:guncelle")),
):
    return epikriz_service.update_epikriz(session, epikriz_id, body)


@router.post("/{epikriz_id}/onayla", response_model=EpikrizRead)
def onayla_epikriz(
    epikriz_id: int,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("epikriz:onayla")),
):
    return epikriz_service.onayla_epikriz(session, current_user, epikriz_id)
