from datetime import date, timedelta

from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.batch_load import batch_by_ids
from app.core.lookups import personel_getir
from app.core.pagination import Page, make_page, paginate
from app.core.permissions import Kapsam
from app.core.scope import kullanici_kapsamli_filtre_uygula
from app.features.departmanlar.models import Departman
from app.features.kullanicilar.models import Kullanici
from app.features.nobet_cizelgesi.models import NobetCizelgesi, NobetDepartmanCizelgesi
from app.features.nobet_cizelgesi.schemas import (
    NobetCreate,
    NobetCizelgeEnsure,
    NobetCizelgeRead,
    NobetRead,
    NobetUpdate,
)
from app.features.personel.models import Personel


def _hafta_bitis(hafta_baslangic: date) -> date:
    return hafta_baslangic + timedelta(days=6)


def _personel_ad_map(session: Session, personel_ids: set[int]) -> dict[int, str]:
    personeller = batch_by_ids(session, Personel, personel_ids)
    kullanicilar = batch_by_ids(
        session, Kullanici, (p.kullanici_id for p in personeller.values())
    )
    out: dict[int, str] = {}
    for pid, p in personeller.items():
        k = kullanicilar.get(p.kullanici_id)
        if k:
            ad = f"{k.ad} {k.soyad}".strip()
            out[pid] = ad or p.sicil_no
        else:
            out[pid] = p.sicil_no
    return out


def _departman_ad_map(session: Session, dep_ids: set[int]) -> dict[int, str]:
    deps = batch_by_ids(session, Departman, dep_ids)
    return {d.id: d.ad for d in deps.values() if d.id is not None}


def _to_read(
    n: NobetCizelgesi,
    *,
    personel_ad: dict[int, str],
    departman_ad: dict[int, str],
) -> NobetRead:
    return NobetRead(
        id=n.id,  # type: ignore[arg-type]
        personel_id=n.personel_id,
        personel_ad_soyad=personel_ad.get(n.personel_id),
        tarih=n.tarih,
        vardiya=n.vardiya,
        departman_id=n.departman_id,
        departman_ad=departman_ad.get(n.departman_id),
        cizelge_id=n.cizelge_id,
        sira=n.sira,
    )


def list_nobetler(
    session: Session,
    current_user: Kullanici,
    kapsam: Kapsam,
    *,
    departman_id: int | None = None,
    hafta_baslangic: date | None = None,
    cizelge_id: int | None = None,
    page: int = 1,
    page_size: int = 200,
) -> Page[NobetRead]:
    query = select(NobetCizelgesi)

    if departman_id is not None:
        query = query.where(NobetCizelgesi.departman_id == departman_id)
    if cizelge_id is not None:
        query = query.where(NobetCizelgesi.cizelge_id == cizelge_id)
    if hafta_baslangic is not None:
        query = query.where(
            NobetCizelgesi.tarih >= hafta_baslangic,
            NobetCizelgesi.tarih <= _hafta_bitis(hafta_baslangic),
        )

    def kendi(q):
        personel = personel_getir(session, current_user.id)
        return q.where(NobetCizelgesi.personel_id == personel.id)

    query = kullanici_kapsamli_filtre_uygula(
        query, kapsam, kendi_kaydim_filtresi=kendi
    )
    query = query.order_by(
        NobetCizelgesi.tarih.asc(),
        NobetCizelgesi.vardiya.asc(),
        NobetCizelgesi.sira.asc(),
        NobetCizelgesi.id.asc(),
    )
    rows, total = paginate(session, query, page=page, page_size=page_size)
    personel_ad = _personel_ad_map(session, {r.personel_id for r in rows})
    departman_ad = _departman_ad_map(session, {r.departman_id for r in rows})
    items = [_to_read(r, personel_ad=personel_ad, departman_ad=departman_ad) for r in rows]
    return make_page(items, total=total, page=page, page_size=page_size)


def list_cizelgeler(
    session: Session,
    *,
    hafta_baslangic: date,
) -> list[NobetCizelgeRead]:
    rows = session.exec(
        select(NobetDepartmanCizelgesi).where(
            NobetDepartmanCizelgesi.hafta_baslangic == hafta_baslangic
        )
    ).all()
    dep_ad = _departman_ad_map(session, {r.departman_id for r in rows})
    return [
        NobetCizelgeRead(
            id=r.id,  # type: ignore[arg-type]
            departman_id=r.departman_id,
            departman_ad=dep_ad.get(r.departman_id),
            hafta_baslangic=r.hafta_baslangic,
            baslik=r.baslik,
        )
        for r in rows
    ]


def ensure_cizelge(session: Session, data: NobetCizelgeEnsure) -> NobetCizelgeRead:
    mevcut = session.exec(
        select(NobetDepartmanCizelgesi).where(
            NobetDepartmanCizelgesi.departman_id == data.departman_id,
            NobetDepartmanCizelgesi.hafta_baslangic == data.hafta_baslangic,
        )
    ).first()
    if mevcut:
        dep = session.get(Departman, mevcut.departman_id)
        return NobetCizelgeRead(
            id=mevcut.id,  # type: ignore[arg-type]
            departman_id=mevcut.departman_id,
            departman_ad=dep.ad if dep else None,
            hafta_baslangic=mevcut.hafta_baslangic,
            baslik=mevcut.baslik,
        )
    dep = session.get(Departman, data.departman_id)
    if dep is None:
        raise HTTPException(status_code=404, detail="Departman bulunamadı")
    row = NobetDepartmanCizelgesi(
        departman_id=data.departman_id,
        hafta_baslangic=data.hafta_baslangic,
        baslik=f"{dep.ad} — {data.hafta_baslangic.isoformat()}",
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return NobetCizelgeRead(
        id=row.id,  # type: ignore[arg-type]
        departman_id=row.departman_id,
        departman_ad=dep.ad,
        hafta_baslangic=row.hafta_baslangic,
        baslik=row.baslik,
    )


def _ensure_cizelge_id(
    session: Session, departman_id: int, tarih: date
) -> int | None:
    """Pazartesi haftasını bul veya oluştur."""
    hafta = tarih - timedelta(days=tarih.weekday())
    c = ensure_cizelge(
        session, NobetCizelgeEnsure(departman_id=departman_id, hafta_baslangic=hafta)
    )
    return c.id


def create_nobet(session: Session, data: NobetCreate) -> NobetRead:
    cizelge_id = data.cizelge_id
    if cizelge_id is None:
        cizelge_id = _ensure_cizelge_id(session, data.departman_id, data.tarih)

    clash = session.exec(
        select(NobetCizelgesi).where(
            NobetCizelgesi.departman_id == data.departman_id,
            NobetCizelgesi.tarih == data.tarih,
            NobetCizelgesi.vardiya == data.vardiya,
            NobetCizelgesi.sira == data.sira,
        )
    ).first()
    if clash:
        raise HTTPException(
            status_code=409,
            detail="Bu hücrede zaten nöbet ataması var. Önce taşıyın veya silin.",
        )

    n = NobetCizelgesi(
        personel_id=data.personel_id,
        tarih=data.tarih,
        vardiya=data.vardiya,
        departman_id=data.departman_id,
        cizelge_id=cizelge_id,
        sira=data.sira,
    )
    session.add(n)
    session.commit()
    session.refresh(n)
    personel_ad = _personel_ad_map(session, {n.personel_id})
    departman_ad = _departman_ad_map(session, {n.departman_id})
    return _to_read(n, personel_ad=personel_ad, departman_ad=departman_ad)


def update_nobet(session: Session, nobet_id: int, data: NobetUpdate) -> NobetRead:
    n = session.get(NobetCizelgesi, nobet_id)
    if n is None:
        raise HTTPException(status_code=404, detail="Nöbet kaydı bulunamadı")
    payload = data.model_dump(exclude_unset=True)
    new_dep = payload.get("departman_id", n.departman_id)
    new_tarih = payload.get("tarih", n.tarih)
    new_vardiya = payload.get("vardiya", n.vardiya)
    new_sira = payload.get("sira", n.sira)

    if any(k in payload for k in ("departman_id", "tarih", "vardiya", "sira")):
        clash = session.exec(
            select(NobetCizelgesi).where(
                NobetCizelgesi.departman_id == new_dep,
                NobetCizelgesi.tarih == new_tarih,
                NobetCizelgesi.vardiya == new_vardiya,
                NobetCizelgesi.sira == new_sira,
                NobetCizelgesi.id != nobet_id,
            )
        ).first()
        if clash:
            raise HTTPException(status_code=409, detail="Hedef hücre dolu")

    for k, v in payload.items():
        setattr(n, k, v)

    if any(k in payload for k in ("departman_id", "tarih")):
        n.cizelge_id = _ensure_cizelge_id(session, n.departman_id, n.tarih)

    session.add(n)
    session.commit()
    session.refresh(n)
    personel_ad = _personel_ad_map(session, {n.personel_id})
    departman_ad = _departman_ad_map(session, {n.departman_id})
    return _to_read(n, personel_ad=personel_ad, departman_ad=departman_ad)


def delete_nobet(session: Session, nobet_id: int) -> None:
    n = session.get(NobetCizelgesi, nobet_id)
    if n is None:
        raise HTTPException(status_code=404, detail="Nöbet kaydı bulunamadı")
    session.delete(n)
    session.commit()
