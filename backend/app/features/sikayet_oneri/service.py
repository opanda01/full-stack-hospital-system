from datetime import datetime

from sqlalchemy import not_
from sqlmodel import Session, select

from app.core.batch_load import batch_by_ids
from app.core.enums import Rol
from app.core.pagination import Page, make_page, paginate
from app.features.kullanicilar.models import Kullanici
from app.features.sikayet_oneri.models import SikayetOneri
from app.features.sikayet_oneri.schemas import (
    SikayetKaynak,
    SikayetOneriCreate,
    SikayetOneriRead,
    SikayetSiralama,
)


def kaynak_grubu_for_rol(rol: Rol | str) -> SikayetKaynak:
    if rol == Rol.HASTA or rol == "HASTA":
        return SikayetKaynak.HASTA
    if rol == Rol.DOKTOR or rol == "DOKTOR":
        return SikayetKaynak.DOKTOR
    return SikayetKaynak.PERSONEL


def _kaynak_filtre(q, kaynak: SikayetKaynak | None):
    if kaynak is None:
        return q
    q = q.join(Kullanici, Kullanici.id == SikayetOneri.gonderen_kullanici_id)
    if kaynak == SikayetKaynak.HASTA:
        return q.where(Kullanici.rol == Rol.HASTA)
    if kaynak == SikayetKaynak.DOKTOR:
        return q.where(Kullanici.rol == Rol.DOKTOR)
    return q.where(not_(Kullanici.rol.in_([Rol.HASTA, Rol.DOKTOR])))


def _to_read(row: SikayetOneri, kullanicilar: dict[int, Kullanici]) -> SikayetOneriRead:
    k = kullanicilar.get(row.gonderen_kullanici_id)
    rol_val = k.rol if k else Rol.HASTA
    if isinstance(rol_val, Rol):
        rol_str = rol_val.value
    else:
        rol_str = str(rol_val)
    ad_soyad = None
    if k:
        ad_soyad = f"{k.ad} {k.soyad}".strip() or None
    return SikayetOneriRead(
        id=row.id,  # type: ignore[arg-type]
        gonderen_kullanici_id=row.gonderen_kullanici_id,
        gonderen_ad_soyad=ad_soyad,
        gonderen_rol=rol_str,
        kaynak_grubu=kaynak_grubu_for_rol(rol_val),
        tur=row.tur,
        icerik=row.icerik,
        tarih=row.tarih,
        durum=row.durum,
    )


def list_sikayetler(
    session: Session,
    *,
    siralama: SikayetSiralama = SikayetSiralama.YENI_ONCE,
    kaynak: SikayetKaynak | None = None,
    tur: str | None = None,
    durum: str | None = None,
    tarih_baslangic: datetime | None = None,
    tarih_bitis: datetime | None = None,
    page: int = 1,
    page_size: int = 50,
) -> Page[SikayetOneriRead]:
    q = select(SikayetOneri)
    q = _kaynak_filtre(q, kaynak)
    if tur:
        q = q.where(SikayetOneri.tur == tur.upper())
    if durum:
        q = q.where(SikayetOneri.durum == durum.upper())
    if tarih_baslangic is not None:
        q = q.where(SikayetOneri.tarih >= tarih_baslangic)
    if tarih_bitis is not None:
        q = q.where(SikayetOneri.tarih <= tarih_bitis)

    if siralama == SikayetSiralama.ESKI_ONCE:
        q = q.order_by(SikayetOneri.tarih.asc(), SikayetOneri.id.asc())
    else:
        q = q.order_by(SikayetOneri.tarih.desc(), SikayetOneri.id.desc())

    rows, total = paginate(session, q, page=page, page_size=page_size)
    kullanicilar = batch_by_ids(
        session, Kullanici, (r.gonderen_kullanici_id for r in rows)
    )
    items = [_to_read(r, kullanicilar) for r in rows]
    return make_page(items, total=total, page=page, page_size=page_size)


def list_benim_sikayetler(
    session: Session,
    current_user: Kullanici,
    *,
    page: int = 1,
    page_size: int = 50,
) -> Page[SikayetOneriRead]:
    q = (
        select(SikayetOneri)
        .where(SikayetOneri.gonderen_kullanici_id == current_user.id)
        .order_by(SikayetOneri.tarih.desc(), SikayetOneri.id.desc())
    )
    rows, total = paginate(session, q, page=page, page_size=page_size)
    kullanicilar = batch_by_ids(session, Kullanici, {current_user.id})
    items = [_to_read(r, kullanicilar) for r in rows]
    return make_page(items, total=total, page=page, page_size=page_size)


def create_sikayet(
    session: Session, current_user: Kullanici, data: SikayetOneriCreate
) -> SikayetOneriRead:
    kayit = SikayetOneri(
        gonderen_kullanici_id=current_user.id,
        tur=data.tur.upper(),
        icerik=data.icerik,
        durum="ACIK",
    )
    session.add(kayit)
    session.commit()
    session.refresh(kayit)
    kullanicilar = batch_by_ids(session, Kullanici, {current_user.id})
    return _to_read(kayit, kullanicilar)
