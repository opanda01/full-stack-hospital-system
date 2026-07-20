from fastapi import HTTPException
from sqlmodel import Session, select

from app.features.departmanlar.models import Departman
from app.features.departmanlar.schemas import DepartmanCreate, DepartmanUpdate


def list_departmanlar(session: Session) -> list[Departman]:
    return list(session.exec(select(Departman).order_by(Departman.ad)).all())


def get_departman(session: Session, departman_id: int) -> Departman:
    dep = session.get(Departman, departman_id)
    if dep is None:
        raise HTTPException(status_code=404, detail="Departman bulunamadı")
    return dep


def create_departman(session: Session, data: DepartmanCreate) -> Departman:
    existing = session.exec(select(Departman).where(Departman.ad == data.ad)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Departman adı zaten var")
    dep = Departman(**data.model_dump())
    session.add(dep)
    session.commit()
    session.refresh(dep)
    return dep


def update_departman(
    session: Session, departman_id: int, data: DepartmanUpdate
) -> Departman:
    dep = get_departman(session, departman_id)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(dep, k, v)
    session.add(dep)
    session.commit()
    session.refresh(dep)
    return dep


def delete_departman(session: Session, departman_id: int) -> None:
    dep = get_departman(session, departman_id)
    session.delete(dep)
    session.commit()
