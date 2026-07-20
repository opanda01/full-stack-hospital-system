from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import require_permission
from app.features.personel import service as personel_service
from app.features.personel.schemas import PersonelCreate, PersonelRead, PersonelUpdate

router = APIRouter()


@router.get("/", response_model=list[PersonelRead])
def list_personel(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("personel:listele")),
):
    return personel_service.list_personel(session)


@router.post("/", response_model=PersonelRead, status_code=status.HTTP_201_CREATED)
def create_personel(
    body: PersonelCreate,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("personel:listele")),
):
    return personel_service.create_personel(session, body)


@router.patch("/{personel_id}", response_model=PersonelRead)
def update_personel(
    personel_id: int,
    body: PersonelUpdate,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("personel:listele")),
):
    return personel_service.update_personel(session, personel_id, body)
