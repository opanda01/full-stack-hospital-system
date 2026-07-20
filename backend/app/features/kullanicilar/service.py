from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.enums import Rol
from app.core.security import hash_password
from app.features.kullanicilar.models import Kullanici
from app.features.kullanicilar.schemas import KullaniciCreate, KullaniciUpdate


def list_kullanicilar(session: Session) -> list[Kullanici]:
    return list(session.exec(select(Kullanici).order_by(Kullanici.id)).all())


def get_kullanici(session: Session, kullanici_id: int) -> Kullanici:
    kullanici = session.get(Kullanici, kullanici_id)
    if kullanici is None:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return kullanici


def create_kullanici(session: Session, data: KullaniciCreate) -> Kullanici:
    existing = session.exec(
        select(Kullanici).where(
            (Kullanici.email == data.email)
            | (Kullanici.tc_kimlik_no == data.tc_kimlik_no)
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-posta veya TC zaten kayıtlı",
        )
    kullanici = Kullanici(
        tc_kimlik_no=data.tc_kimlik_no,
        ad=data.ad,
        soyad=data.soyad,
        email=data.email,
        telefon=data.telefon,
        sifre_hash=hash_password(data.sifre),
        rol=data.rol,
        aktif_mi=True,
    )
    session.add(kullanici)
    session.commit()
    session.refresh(kullanici)
    return kullanici


def update_kullanici(
    session: Session, kullanici_id: int, data: KullaniciUpdate
) -> Kullanici:
    kullanici = get_kullanici(session, kullanici_id)
    payload = data.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(kullanici, key, value)
    session.add(kullanici)
    session.commit()
    session.refresh(kullanici)
    return kullanici


def set_rol(session: Session, kullanici_id: int, rol: Rol) -> Kullanici:
    kullanici = get_kullanici(session, kullanici_id)
    kullanici.rol = rol
    session.add(kullanici)
    session.commit()
    session.refresh(kullanici)
    return kullanici


def deactivate_kullanici(session: Session, kullanici_id: int) -> Kullanici:
    kullanici = get_kullanici(session, kullanici_id)
    kullanici.aktif_mi = False
    session.add(kullanici)
    session.commit()
    session.refresh(kullanici)
    return kullanici
