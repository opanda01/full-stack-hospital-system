from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.lookups import doktor_getir
from app.core.permissions import Kapsam
from app.features.departmanlar.models import Departman
from app.features.doktorlar.models import Doktor
from app.features.doktorlar.schemas import DoktorCreate, DoktorRead, DoktorUpdate
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel


def _to_read(session: Session, d: Doktor) -> DoktorRead:
    personel = session.get(Personel, d.personel_id)
    kullanici = session.get(Kullanici, personel.kullanici_id) if personel else None
    departman = (
        session.get(Departman, personel.departman_id)
        if personel and personel.departman_id
        else None
    )
    return DoktorRead(
        id=d.id,
        personel_id=d.personel_id,
        uzmanlik_alani=d.uzmanlik_alani,
        diploma_no=d.diploma_no,
        online_randevu_acik_mi=d.online_randevu_acik_mi,
        ad=kullanici.ad if kullanici else None,
        soyad=kullanici.soyad if kullanici else None,
        email=kullanici.email if kullanici else None,
        sicil_no=personel.sicil_no if personel else None,
        departman_id=personel.departman_id if personel else None,
        departman_ad=departman.ad if departman else None,
    )


def list_doktorlar(session: Session) -> list[DoktorRead]:
    rows = list(session.exec(select(Doktor).order_by(Doktor.id)).all())
    return [_to_read(session, d) for d in rows]


def get_doktor(session: Session, doktor_id: int) -> Doktor:
    d = session.get(Doktor, doktor_id)
    if d is None:
        raise HTTPException(status_code=404, detail="Doktor bulunamadı")
    return d


def get_benim_profilim(session: Session, current_user: Kullanici) -> DoktorRead:
    return _to_read(session, doktor_getir(session, current_user.id))


def create_doktor(session: Session, data: DoktorCreate) -> DoktorRead:
    personel = session.get(Personel, data.personel_id)
    if personel is None:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
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
    return _to_read(session, d)


def update_doktor(
    session: Session,
    doktor_id: int,
    data: DoktorUpdate,
    current_user: Kullanici,
    kapsam: Kapsam,
) -> DoktorRead:
    d = get_doktor(session, doktor_id)
    if kapsam == Kapsam.KENDI_KAYDIM:
        own = doktor_getir(session, current_user.id)
        if own.id != d.id:
            raise HTTPException(
                status_code=403, detail="Sadece kendi profilinizi düzenleyebilirsiniz"
            )
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(d, k, v)
    session.add(d)
    session.commit()
    session.refresh(d)
    return _to_read(session, d)
