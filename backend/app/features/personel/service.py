from fastapi import HTTPException
from sqlmodel import Session, select

from app.features.personel.models import Personel
from app.features.personel.schemas import PersonelCreate, PersonelUpdate


def list_personel(session: Session) -> list[Personel]:
    return list(session.exec(select(Personel).order_by(Personel.id)).all())


def get_personel(session: Session, personel_id: int) -> Personel:
    p = session.get(Personel, personel_id)
    if p is None:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    return p


def create_personel(session: Session, data: PersonelCreate) -> Personel:
    existing = session.exec(
        select(Personel).where(
            (Personel.kullanici_id == data.kullanici_id)
            | (Personel.sicil_no == data.sicil_no)
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Personel veya sicil zaten var")
    p = Personel(**data.model_dump())
    session.add(p)
    session.commit()
    session.refresh(p)
    return p


def update_personel(
    session: Session, personel_id: int, data: PersonelUpdate
) -> Personel:
    p = get_personel(session, personel_id)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    session.add(p)
    session.commit()
    session.refresh(p)
    return p
