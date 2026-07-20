"""Ortak entity lookup yardımcıları."""

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.features.doktorlar.models import Doktor
from app.features.hastalar.models import Hasta
from app.features.personel.models import Personel


def personel_getir(session: Session, kullanici_id: int) -> Personel:
    personel = session.exec(
        select(Personel).where(Personel.kullanici_id == kullanici_id)
    ).first()
    if personel is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Personel kaydı bulunamadı",
        )
    return personel


def doktor_getir(session: Session, kullanici_id: int) -> Doktor:
    personel = personel_getir(session, kullanici_id)
    doktor = session.exec(
        select(Doktor).where(Doktor.personel_id == personel.id)
    ).first()
    if doktor is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doktor kaydı bulunamadı",
        )
    return doktor


def hasta_getir(session: Session, kullanici_id: int) -> Hasta:
    hasta = session.exec(
        select(Hasta).where(Hasta.kullanici_id == kullanici_id)
    ).first()
    if hasta is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hasta kaydı bulunamadı",
        )
    return hasta
