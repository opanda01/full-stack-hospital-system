from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.enums import ErisimDurumu, PersonelKaynakTipi, Rol
from app.core.security import hash_password
from app.features.departmanlar.models import Departman
from app.features.doktorlar.models import Doktor
from app.features.kullanicilar.models import Kullanici
from app.features.personel.erisim_service import apply_erisim_durumu
from app.features.personel.models import Personel
from app.features.personel.schemas import (
    PersonelCreate,
    PersonelRead,
    PersonelUpdate,
    PersonelWithUserCreate,
)


def _to_read(session: Session, p: Personel) -> PersonelRead:
    kullanici = session.get(Kullanici, p.kullanici_id)
    departman = (
        session.get(Departman, p.departman_id) if p.departman_id else None
    )
    return PersonelRead(
        id=p.id,
        kullanici_id=p.kullanici_id,
        sicil_no=p.sicil_no,
        departman_id=p.departman_id,
        unvan=p.unvan,
        amir_id=p.amir_id,
        yonetim_gorevi=p.yonetim_gorevi,
        ad=kullanici.ad if kullanici else None,
        soyad=kullanici.soyad if kullanici else None,
        email=kullanici.email if kullanici else None,
        rol=kullanici.rol.value if kullanici and isinstance(kullanici.rol, Rol) else (
            str(kullanici.rol) if kullanici else None
        ),
        departman_ad=departman.ad if departman else None,
        aktif_mi=kullanici.aktif_mi if kullanici else None,
        erisim_durumu=(
            kullanici.erisim_durumu.value
            if kullanici and isinstance(kullanici.erisim_durumu, ErisimDurumu)
            else (str(kullanici.erisim_durumu) if kullanici else None)
        ),
        kaynak_tipi=(
            kullanici.erisim_kaynak_tipi.value
            if kullanici and isinstance(kullanici.erisim_kaynak_tipi, PersonelKaynakTipi)
            else None
        ),
        firma_adi=kullanici.erisim_firma_adi if kullanici else None,
    )


def list_personel(session: Session) -> list[PersonelRead]:
    rows = list(session.exec(select(Personel).order_by(Personel.id)).all())
    return [_to_read(session, p) for p in rows]


def get_personel(session: Session, personel_id: int) -> Personel:
    p = session.get(Personel, personel_id)
    if p is None:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    return p


def create_personel(session: Session, data: PersonelCreate) -> PersonelRead:
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
    return _to_read(session, p)


def create_personel_with_user(
    session: Session, data: PersonelWithUserCreate
) -> PersonelRead:
    existing_user = session.exec(
        select(Kullanici).where(
            (Kullanici.email == data.email)
            | (Kullanici.tc_kimlik_no == data.tc_kimlik_no)
        )
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-posta veya TC zaten kayıtlı",
        )

    existing_sicil = session.exec(
        select(Personel).where(Personel.sicil_no == data.sicil_no)
    ).first()
    if existing_sicil:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sicil numarası zaten kayıtlı",
        )

    if data.rol == Rol.DOKTOR and data.diploma_no:
        existing_dip = session.exec(
            select(Doktor).where(Doktor.diploma_no == data.diploma_no)
        ).first()
        if existing_dip:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Diploma numarası zaten kayıtlı",
            )

    if data.departman_id is not None:
        dep = session.get(Departman, data.departman_id)
        if dep is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Departman bulunamadı",
            )

    if data.kaynak_tipi == PersonelKaynakTipi.DIS_FIRMA and not (
        data.firma_adi or ""
    ).strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Dış firma personeli için firma_adi zorunludur",
        )

    kullanici = Kullanici(
        tc_kimlik_no=data.tc_kimlik_no,
        ad=data.ad,
        soyad=data.soyad,
        email=data.email,
        telefon=data.telefon,
        sifre_hash=hash_password(data.sifre),
        rol=data.rol,
        erisim_kaynak_tipi=data.kaynak_tipi,
        erisim_firma_adi=(data.firma_adi or "").strip() or None,
        sifre_degistirmeli_mi=True,
        kvkk_onaylandi_mi=False,
    )
    apply_erisim_durumu(kullanici, ErisimDurumu.BEKLEMEDE)
    session.add(kullanici)
    session.flush()

    personel = Personel(
        kullanici_id=kullanici.id,
        sicil_no=data.sicil_no,
        departman_id=data.departman_id,
        unvan=data.unvan,
    )
    session.add(personel)
    session.flush()

    if data.rol == Rol.DOKTOR:
        session.add(
            Doktor(
                personel_id=personel.id,
                uzmanlik_alani=data.uzmanlik_alani or "",
                diploma_no=data.diploma_no or "",
                online_randevu_acik_mi=data.online_randevu_acik_mi,
            )
        )

    session.commit()
    session.refresh(personel)
    return _to_read(session, personel)


def update_personel(
    session: Session, personel_id: int, data: PersonelUpdate
) -> PersonelRead:
    p = get_personel(session, personel_id)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    session.add(p)
    session.commit()
    session.refresh(p)
    return _to_read(session, p)
