from fastapi import HTTPException, Request
from sqlmodel import Session, select

from app.core.enums import Rol
from app.core.lookups import doktor_getir
from app.core.permissions import Kapsam
from app.features.doktorlar.models import Doktor
from app.features.doktorlar.schemas import DoktorCreate, DoktorUpdate
from app.features.kullanicilar.models import Kullanici


def list_doktorlar(session: Session) -> list[Doktor]:
    return list(session.exec(select(Doktor).order_by(Doktor.id)).all())


def get_doktor(session: Session, doktor_id: int) -> Doktor:
    d = session.get(Doktor, doktor_id)
    if d is None:
        raise HTTPException(status_code=404, detail="Doktor bulunamadı")
    return d


def get_benim_profilim(session: Session, current_user: Kullanici) -> Doktor:
    return doktor_getir(session, current_user.id)


def create_doktor(session: Session, data: DoktorCreate) -> Doktor:
    existing = session.exec(
        select(Doktor).where(
            (Doktor.personel_id == data.personel_id)
            | (Doktor.diploma_no == data.diploma_no)
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Doktor kaydı zaten var")
    d = Doktor(**data.model_dump())
    session.add(d)
    session.commit()
    session.refresh(d)
    return d


def update_doktor(
    session: Session,
    doktor_id: int,
    data: DoktorUpdate,
    current_user: Kullanici,
    kapsam: Kapsam,
) -> Doktor:
    d = get_doktor(session, doktor_id)
    if kapsam == Kapsam.KENDI_KAYDIM:
        own = doktor_getir(session, current_user.id)
        if own.id != d.id:
            raise HTTPException(status_code=403, detail="Sadece kendi profilinizi düzenleyebilirsiniz")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(d, k, v)
    session.add(d)
    session.commit()
    session.refresh(d)
    return d
