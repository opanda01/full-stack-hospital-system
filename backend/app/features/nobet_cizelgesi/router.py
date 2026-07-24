from fastapi import APIRouter, Depends, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.pagination import Page, PaginationParams, get_pagination
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.nobet_cizelgesi import service as nobet_service
from app.features.nobet_cizelgesi.schemas import NobetCreate, NobetRead

router = APIRouter()


@router.get("/", response_model=Page[NobetRead])
def list_nobetler(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination),
    current_user: Kullanici = Depends(require_permission("nobet:goruntule")),
    session: Session = Depends(get_session),
):
    return nobet_service.list_nobetler(
        session,
        current_user,
        request.state.kapsam,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.post("/", response_model=NobetRead, status_code=status.HTTP_201_CREATED)
def create_nobet(
    body: NobetCreate,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("nobet:olustur")),
):
    return nobet_service.create_nobet(session, body)
