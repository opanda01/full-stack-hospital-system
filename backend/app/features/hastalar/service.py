from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.enums import ErisimDurumu, Rol
from app.core.security import hash_password
from app.features.hastalar.models import Hasta
from app.features.hastalar.schemas import HastaCreate, HastaCreateWithUser, HastaUpdate
from app.features.kullanicilar.models import Kullanici
from app.features.personel.erisim_service import apply_erisim_durumu


def list_hastalar(session: Session) -> list[Hasta]:
    return list(session.exec(select(Hasta).order_by(Hasta.id)).all())


def get_hasta(session: Session, hasta_id: int) -> Hasta:
    h = session.get(Hasta, hasta_id)
    if h is None:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")
    return h


def create_hasta(session: Session, data: HastaCreate) -> Hasta:
    existing = session.exec(
        select(Hasta).where(
            (Hasta.kullanici_id == data.kullanici_id)
            | (Hasta.tc_kimlik_no == data.tc_kimlik_no)
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Hasta kaydı zaten var")
    h = Hasta(**data.model_dump())
    session.add(h)
    session.commit()
    session.refresh(h)
    return h


def create_hasta_with_user(session: Session, data: HastaCreateWithUser) -> Hasta:
    existing_user = session.exec(
        select(Kullanici).where(
            (Kullanici.email == data.email)
            | (Kullanici.tc_kimlik_no == data.tc_kimlik_no)
        )
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=400, detail="Bu e-posta veya TC ile kayıt zaten var"
        )
    kullanici = Kullanici(
        tc_kimlik_no=data.tc_kimlik_no,
        ad=data.ad,
        soyad=data.soyad,
        email=data.email,
        telefon=data.telefon,
        sifre_hash=hash_password(data.sifre),
        rol=Rol.HASTA,
    )
    apply_erisim_durumu(kullanici, ErisimDurumu.ONAYLANDI)
    session.add(kullanici)
    session.flush()
    h = Hasta(
        kullanici_id=kullanici.id,
        tc_kimlik_no=data.tc_kimlik_no,
        dogum_tarihi=data.dogum_tarihi,
        cinsiyet=data.cinsiyet,
        kan_grubu=data.kan_grubu,
        adres=data.adres,
    )
    session.add(h)
    session.commit()
    session.refresh(h)
    return h


def update_hasta(session: Session, hasta_id: int, data: HastaUpdate) -> Hasta:
    h = get_hasta(session, hasta_id)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(h, k, v)
    session.add(h)
    session.commit()
    session.refresh(h)
    return h
