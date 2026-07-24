from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.pagination import Page, PaginationParams, get_pagination
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.sikayet_oneri import service as sikayet_service
from app.features.sikayet_oneri.schemas import SikayetOneriCreate, SikayetOneriRead

router = APIRouter()


@router.get("/", response_model=Page[SikayetOneriRead])
def list_sikayet_oneri(
    pagination: PaginationParams = Depends(get_pagination),
    session: Session = Depends(get_session),
    _user=Depends(require_permission("sikayet_oneri:tumunu_goruntule")),
):
    return sikayet_service.list_sikayetler(
        session, page=pagination.page, page_size=pagination.page_size
    )


@router.post("/", response_model=SikayetOneriRead, status_code=status.HTTP_201_CREATED)
def create_sikayet_oneri(
    body: SikayetOneriCreate,
    current_user: Kullanici = Depends(require_permission("sikayet_oneri:gonder")),
    session: Session = Depends(get_session),
):
    return sikayet_service.create_sikayet(session, current_user, body)
