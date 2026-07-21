from fastapi import HTTPException
from sqlmodel import Session, select

from app.features.departmanlar.models import Birim, Departman
from app.features.departmanlar.schemas import (
    BirimCreate,
    BirimRead,
    BirimUpdate,
    DepartmanCreate,
    DepartmanRead,
    DepartmanUpdate,
)


def _departman_to_read(session: Session, dep: Departman) -> DepartmanRead:
    birim = session.get(Birim, dep.birim_id) if dep.birim_id else None
    return DepartmanRead(
        id=dep.id,
        ad=dep.ad,
        birim_id=dep.birim_id,
        birim_ad=birim.ad if birim else None,
        kategori=dep.kategori,
        aciklama=dep.aciklama,
        kat_no=dep.kat_no,
    )


def list_birimler(session: Session) -> list[BirimRead]:
    rows = list(session.exec(select(Birim).order_by(Birim.sira, Birim.ad)).all())
    return [BirimRead.model_validate(b) for b in rows]


def create_birim(session: Session, data: BirimCreate) -> BirimRead:
    existing = session.exec(select(Birim).where(Birim.ad == data.ad)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Birim adı zaten var")
    birim = Birim(**data.model_dump())
    session.add(birim)
    session.commit()
    session.refresh(birim)
    return BirimRead.model_validate(birim)


def update_birim(session: Session, birim_id: int, data: BirimUpdate) -> BirimRead:
    birim = session.get(Birim, birim_id)
    if birim is None:
        raise HTTPException(status_code=404, detail="Birim bulunamadı")
    payload = data.model_dump(exclude_unset=True)
    if "ad" in payload and payload["ad"] is not None:
        conflict = session.exec(
            select(Birim).where(Birim.ad == payload["ad"], Birim.id != birim_id)
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Birim adı zaten var")
    for k, v in payload.items():
        setattr(birim, k, v)
    session.add(birim)
    session.commit()
    session.refresh(birim)
    return BirimRead.model_validate(birim)


def list_departmanlar(session: Session) -> list[DepartmanRead]:
    rows = list(session.exec(select(Departman).order_by(Departman.ad)).all())
    return [_departman_to_read(session, d) for d in rows]


def get_departman(session: Session, departman_id: int) -> Departman:
    dep = session.get(Departman, departman_id)
    if dep is None:
        raise HTTPException(status_code=404, detail="Departman bulunamadı")
    return dep


def create_departman(session: Session, data: DepartmanCreate) -> DepartmanRead:
    existing = session.exec(select(Departman).where(Departman.ad == data.ad)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Departman adı zaten var")
    if data.birim_id is not None and session.get(Birim, data.birim_id) is None:
        raise HTTPException(status_code=404, detail="Birim bulunamadı")
    payload = data.model_dump()
    if data.birim_id and not data.kategori:
        birim = session.get(Birim, data.birim_id)
        if birim:
            payload["kategori"] = birim.ad
    dep = Departman(**payload)
    session.add(dep)
    session.commit()
    session.refresh(dep)
    return _departman_to_read(session, dep)


def update_departman(
    session: Session, departman_id: int, data: DepartmanUpdate
) -> DepartmanRead:
    dep = get_departman(session, departman_id)
    payload = data.model_dump(exclude_unset=True)
    if "birim_id" in payload and payload["birim_id"] is not None:
        if session.get(Birim, payload["birim_id"]) is None:
            raise HTTPException(status_code=404, detail="Birim bulunamadı")
        if "kategori" not in payload:
            birim = session.get(Birim, payload["birim_id"])
            if birim:
                payload["kategori"] = birim.ad
    for k, v in payload.items():
        setattr(dep, k, v)
    session.add(dep)
    session.commit()
    session.refresh(dep)
    return _departman_to_read(session, dep)


def delete_departman(session: Session, departman_id: int) -> None:
    dep = get_departman(session, departman_id)
    session.delete(dep)
    session.commit()
