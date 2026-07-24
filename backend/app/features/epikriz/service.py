from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.enums import EpikrizDurumu, Rol
from app.core.lookups import doktor_getir
from app.core.public_id import hasta_pk_from_public_id, hasta_public_id_from_pk
from app.features.epikriz.models import Epikriz
from app.features.epikriz.schemas import EpikrizCreate, EpikrizRead, EpikrizUpdate
from app.features.kullanicilar.models import Kullanici
from app.features.yatis.models import YatisKaydi


def _to_read(session: Session, row: Epikriz) -> EpikrizRead:
    return EpikrizRead(
        id=row.id,
        yatis_id=row.yatis_id,
        hasta_id=hasta_public_id_from_pk(session, row.hasta_id),
        yazar_id=row.yazar_id,
        durum=row.durum,
        sikayet_oyku=row.sikayet_oyku,
        fizik_muayene=row.fizik_muayene,
        tani=row.tani,
        tedavi_ozeti=row.tedavi_ozeti,
        taburcu_onerileri=row.taburcu_onerileri,
        onaylayan_doktor_id=row.onaylayan_doktor_id,
        onaylandi_at=row.onaylandi_at,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def list_epikriz(
    session: Session,
    *,
    yatis_id: int | None = None,
    hasta_id: UUID | None = None,
) -> list[EpikrizRead]:
    q = select(Epikriz)
    if yatis_id is not None:
        q = q.where(Epikriz.yatis_id == yatis_id)
    if hasta_id is not None:
        q = q.where(Epikriz.hasta_id == hasta_pk_from_public_id(session, hasta_id))
    rows = list(session.exec(q.order_by(Epikriz.id.desc())).all())
    return [_to_read(session, r) for r in rows]


def get_epikriz(session: Session, epikriz_id: int) -> EpikrizRead:
    row = session.get(Epikriz, epikriz_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Epikriz bulunamadı")
    return _to_read(session, row)


def create_epikriz(
    session: Session, current_user: Kullanici, body: EpikrizCreate
) -> EpikrizRead:
    yatis = session.get(YatisKaydi, body.yatis_id)
    if yatis is None:
        raise HTTPException(status_code=404, detail="Yatış kaydı bulunamadı")
    row = Epikriz(
        yatis_id=yatis.id,
        hasta_id=yatis.hasta_id,
        yazar_id=current_user.id,
        durum=EpikrizDurumu.TASLAK.value,
        sikayet_oyku=body.sikayet_oyku,
        fizik_muayene=body.fizik_muayene,
        tani=body.tani,
        tedavi_ozeti=body.tedavi_ozeti,
        taburcu_onerileri=body.taburcu_onerileri,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return _to_read(session, row)


def update_epikriz(
    session: Session, epikriz_id: int, body: EpikrizUpdate
) -> EpikrizRead:
    row = session.get(Epikriz, epikriz_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Epikriz bulunamadı")
    if row.durum != EpikrizDurumu.TASLAK.value:
        raise HTTPException(
            status_code=400, detail="Onaylanmış epikriz güncellenemez"
        )
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(row, k, v)
    session.add(row)
    session.commit()
    session.refresh(row)
    return _to_read(session, row)


def onayla_epikriz(
    session: Session, current_user: Kullanici, epikriz_id: int
) -> EpikrizRead:
    row = session.get(Epikriz, epikriz_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Epikriz bulunamadı")
    if row.durum == EpikrizDurumu.ONAYLANDI.value:
        raise HTTPException(status_code=400, detail="Epikriz zaten onaylı")
    doktor_id = None
    if current_user.rol == Rol.DOKTOR:
        doktor = doktor_getir(session, current_user.id)
        doktor_id = doktor.id
    row.durum = EpikrizDurumu.ONAYLANDI.value
    row.onaylayan_doktor_id = doktor_id
    row.onaylandi_at = datetime.now(timezone.utc)
    session.add(row)
    session.commit()
    session.refresh(row)
    return _to_read(session, row)
