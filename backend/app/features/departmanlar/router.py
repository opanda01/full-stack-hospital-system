from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import require_permission
from app.features.departmanlar import service as dep_service
from app.features.departmanlar.schemas import (
    BirimCreate,
    BirimRead,
    DepartmanCreate,
    DepartmanRead,
    DepartmanUpdate,
)

router = APIRouter()


@router.get("/birimler", response_model=list[BirimRead])
def list_birimler(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("departman:goruntule")),
):
    return dep_service.list_birimler(session)


@router.post(
    "/birimler",
    response_model=BirimRead,
    status_code=status.HTTP_201_CREATED,
)
def create_birim(
    body: BirimCreate,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("departman:olustur")),
):
    return dep_service.create_birim(session, body)


@router.get("/", response_model=list[DepartmanRead])
def list_departmanlar(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("departman:goruntule")),
):
    return dep_service.list_departmanlar(session)


@router.post("/", response_model=DepartmanRead, status_code=status.HTTP_201_CREATED)
def create_departman(
    body: DepartmanCreate,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("departman:olustur")),
):
    return dep_service.create_departman(session, body)


@router.patch("/{departman_id}", response_model=DepartmanRead)
def update_departman(
    departman_id: int,
    body: DepartmanUpdate,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("departman:olustur")),
):
    return dep_service.update_departman(session, departman_id, body)


@router.delete("/{departman_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_departman(
    departman_id: int,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("departman:olustur")),
):
    dep_service.delete_departman(session, departman_id)
