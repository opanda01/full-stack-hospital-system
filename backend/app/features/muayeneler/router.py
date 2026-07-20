from fastapi import APIRouter, Depends, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.muayeneler import service as muayene_service
from app.features.muayeneler.schemas import MuayeneCreate, MuayeneRead

router = APIRouter()


@router.post("/", response_model=MuayeneRead, status_code=status.HTTP_201_CREATED)
def create_muayene(
    body: MuayeneCreate,
    request: Request,
    current_user: Kullanici = Depends(require_permission("muayene:olustur")),
    session: Session = Depends(get_session),
):
    return muayene_service.create_muayene(
        session, current_user, body, request.state.kapsam
    )


@router.get("/", response_model=list[MuayeneRead])
def list_muayeneler(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("muayene:goruntule")),
):
    return muayene_service.list_muayeneler(session)
