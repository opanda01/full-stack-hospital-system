from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.enums import EpikrizDurumu, OturumTipi, Rol
from app.core.lookups import doktor_getir, hasta_getir
from app.core.pagination import Page, make_page, paginate
from app.core.permissions import Kapsam
from app.core.public_id import hasta_pk_from_public_id, hasta_public_id_from_pk
from app.core.scope import erisim_rolu
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


def _hasta_pk_for_kendi(
    session: Session,
    current_user: Kullanici,
    *,
    oturum_tipi: OturumTipi = OturumTipi.PERSONEL,
) -> int:
    if erisim_rolu(current_user, oturum_tipi) != Rol.HASTA:
        raise HTTPException(
            status_code=403, detail="Kendi kaydı kapsamı bu rol için tanımlı değil"
        )
    hasta = hasta_getir(session, current_user.id)
    assert hasta.id is not None
    return hasta.id


def list_epikriz(
    session: Session,
    *,
    current_user: Kullanici | None = None,
    kapsam: Kapsam | None = None,
    yatis_id: int | None = None,
    hasta_id: UUID | None = None,
    page: int = 1,
    page_size: int = 50,
    oturum_tipi: OturumTipi = OturumTipi.PERSONEL,
) -> Page[EpikrizRead]:
    q = select(Epikriz).order_by(Epikriz.id.desc())
    if kapsam == Kapsam.KENDI_KAYDIM:
        if current_user is None:
            raise HTTPException(status_code=403, detail="Kapsam için kullanıcı gerekli")
        kendi_pk = _hasta_pk_for_kendi(
            session, current_user, oturum_tipi=oturum_tipi
        )
        q = q.where(Epikriz.hasta_id == kendi_pk)
        if erisim_rolu(current_user, oturum_tipi) == Rol.HASTA:
            q = q.where(Epikriz.durum == EpikrizDurumu.ONAYLANDI.value)
    else:
        if yatis_id is not None:
            q = q.where(Epikriz.yatis_id == yatis_id)
        if hasta_id is not None:
            q = q.where(Epikriz.hasta_id == hasta_pk_from_public_id(session, hasta_id))
    rows, total = paginate(session, q, page=page, page_size=page_size)
    return make_page(
        [_to_read(session, r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


def get_epikriz(
    session: Session,
    epikriz_id: int,
    *,
    current_user: Kullanici | None = None,
    kapsam: Kapsam | None = None,
    oturum_tipi: OturumTipi = OturumTipi.PERSONEL,
) -> EpikrizRead:
    row = session.get(Epikriz, epikriz_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Epikriz bulunamadı")
    if kapsam == Kapsam.KENDI_KAYDIM:
        if current_user is None:
            raise HTTPException(status_code=403, detail="Kapsam için kullanıcı gerekli")
        kendi_pk = _hasta_pk_for_kendi(
            session, current_user, oturum_tipi=oturum_tipi
        )
        if row.hasta_id != kendi_pk:
            raise HTTPException(status_code=403, detail="Bu epikrize erişim yetkiniz yok")
        if (
            erisim_rolu(current_user, oturum_tipi) == Rol.HASTA
            and row.durum != EpikrizDurumu.ONAYLANDI.value
        ):
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


def olustur_taslak_epikriz_ameliyat_sonrasi(
    session: Session,
    *,
    hasta_id: int,
    ameliyat_adi: str,
    yazar_id: int,
) -> Epikriz | None:
    """Ameliyat tamamlanınca aktif yatış için taslak epikriz (service-to-service)."""
    yatis = session.exec(
        select(YatisKaydi).where(
            YatisKaydi.hasta_id == hasta_id,
            YatisKaydi.aktif_mi == True,  # noqa: E712
        )
    ).first()
    if yatis is None:
        return None
    mevcut = session.exec(
        select(Epikriz).where(
            Epikriz.yatis_id == yatis.id,
            Epikriz.durum == EpikrizDurumu.TASLAK.value,
        )
    ).first()
    if mevcut is not None:
        return mevcut
    row = Epikriz(
        yatis_id=yatis.id,
        hasta_id=hasta_id,
        yazar_id=yazar_id,
        durum=EpikrizDurumu.TASLAK.value,
        tedavi_ozeti=f"Ameliyat: {ameliyat_adi}",
    )
    session.add(row)
    session.flush()
    return row


def update_epikriz(
    session: Session, epikriz_id: int, body: EpikrizUpdate
) -> EpikrizRead:
    row = session.get(Epikriz, epikriz_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Epikriz bulunamadı")
    if row.durum == EpikrizDurumu.ONAYLANDI.value:
        raise HTTPException(status_code=400, detail="Onaylı epikriz güncellenemez")
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
    doktor = doktor_getir(session, current_user.id)
    row.durum = EpikrizDurumu.ONAYLANDI.value
    row.onaylayan_doktor_id = doktor.id
    row.onaylandi_at = datetime.now(timezone.utc)
    session.add(row)
    session.commit()
    session.refresh(row)
    return _to_read(session, row)
