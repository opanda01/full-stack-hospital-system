from fastapi import APIRouter, Depends, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.tetkikler import service as tetkik_service
from app.features.tetkikler.schemas import TetkikCreate, TetkikRead, TetkikSonucUpdate

router = APIRouter()


@router.get("/", response_model=list[TetkikRead])
def list_tetkikler(
    request: Request,
    hasta_id: int | None = None,
    current_user: Kullanici = Depends(require_permission("tetkik:goruntule")),
    session: Session = Depends(get_session),
):
    return tetkik_service.listele(
        session, current_user, request.state.kapsam, hasta_id=hasta_id
    )


@router.get("/{tetkik_id}", response_model=TetkikRead)
def get_tetkik(
    tetkik_id: int,
    request: Request,
    current_user: Kullanici = Depends(require_permission("tetkik:goruntule")),
    session: Session = Depends(get_session),
):
    from app.features.bashekim.router import phi_goruntuleme_logla

    row = tetkik_service.getir(session, current_user, tetkik_id)
    phi_goruntuleme_logla(
        session,
        actor=current_user,
        kaynak="tetkik",
        kaynak_id=tetkik_id,
        request=request,
    )
    return row



@router.post("/", response_model=TetkikRead, status_code=status.HTTP_201_CREATED)
def create_tetkik(
    body: TetkikCreate,
    request: Request,
    current_user: Kullanici = Depends(require_permission("tetkik:iste")),
    session: Session = Depends(get_session),
):
    return tetkik_service.olustur(session, current_user, body, request.state.kapsam)


@router.patch("/{tetkik_id}/sonuc", response_model=TetkikRead)
def tetkik_sonuc_gir(
    tetkik_id: int,
    body: TetkikSonucUpdate,
    current_user: Kullanici = Depends(require_permission("tetkik:sonuc_gir")),
    session: Session = Depends(get_session),
):
    return tetkik_service.sonuc_gir(
        session, current_user, tetkik_id, body.sonuc_dosyasi, body.durum
    )
