from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.batch_load import batch_by_ids
from app.core.enums import Rol
from app.core.lookups import personel_getir
from app.core.pagination import Page, make_page, paginate
from app.core.permissions import Kapsam
from app.core.scope import kullanici_kapsamli_filtre_uygula
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.temizlik_gorevleri.models import TemizlikGorevi
from app.features.temizlik_gorevleri.schemas import (
    TemizlikGoreviCreate,
    TemizlikGoreviRead,
    TemizlikGoreviUpdate,
)


def _hafta_bitis(hafta_baslangic: date) -> date:
    return hafta_baslangic + timedelta(days=6)


def _yonetim_mi(user: Kullanici) -> bool:
    return user.rol in (Rol.ADMIN, Rol.BASHEKIM, Rol.MUDUR)


def _assert_temizlik_personeli(session: Session, personel_id: int) -> Personel:
    p = session.get(Personel, personel_id)
    if p is None:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    k = session.get(Kullanici, p.kullanici_id)
    if k is None or k.rol != Rol.TEMIZLIK_PERSONELI:
        raise HTTPException(
            status_code=400,
            detail="Temizlik görevi yalnızca temizlik personeline atanabilir.",
        )
    return p


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


def _to_read(g: TemizlikGorevi, personel_ad: dict[int, str]) -> TemizlikGoreviRead:
    return TemizlikGoreviRead(
        id=g.id,  # type: ignore[arg-type]
        personel_id=g.personel_id,
        personel_ad_soyad=personel_ad.get(g.personel_id),
        oda_bolum=g.oda_bolum,
        gorev_tarihi=g.gorev_tarihi,
        durum=g.durum,
        onay_veren_id=g.onay_veren_id,
    )


def listele(
    session: Session,
    current_user: Kullanici,
    kapsam: Kapsam,
    *,
    hafta_baslangic: date | None = None,
    page: int = 1,
    page_size: int = 200,
) -> Page[TemizlikGoreviRead]:
    query = select(TemizlikGorevi)

    if hafta_baslangic is not None:
        query = query.where(
            TemizlikGorevi.gorev_tarihi >= hafta_baslangic,
            TemizlikGorevi.gorev_tarihi <= _hafta_bitis(hafta_baslangic),
        )

    def kendi(q):
        personel = personel_getir(session, current_user.id)
        return q.where(TemizlikGorevi.personel_id == personel.id)

    query = kullanici_kapsamli_filtre_uygula(
        query, kapsam, kendi_kaydim_filtresi=kendi
    )
    query = query.order_by(
        TemizlikGorevi.oda_bolum.asc(),
        TemizlikGorevi.gorev_tarihi.asc(),
        TemizlikGorevi.id.asc(),
    )
    rows, total = paginate(session, query, page=page, page_size=page_size)
    personel_ad = _personel_ad_map(session, {r.personel_id for r in rows})
    items = [_to_read(r, personel_ad) for r in rows]
    return make_page(items, total=total, page=page, page_size=page_size)


def ata(
    session: Session, current_user: Kullanici, veri: TemizlikGoreviCreate
) -> TemizlikGoreviRead:
    _assert_temizlik_personeli(session, veri.personel_id)
    clash = session.exec(
        select(TemizlikGorevi).where(
            TemizlikGorevi.oda_bolum == veri.oda_bolum,
            TemizlikGorevi.gorev_tarihi == veri.gorev_tarihi,
        )
    ).first()
    if clash:
        raise HTTPException(
            status_code=409,
            detail="Bu bölüm ve tarih için zaten görev var. Önce taşıyın veya silin.",
        )
    gorev = TemizlikGorevi(
        personel_id=veri.personel_id,
        oda_bolum=veri.oda_bolum,
        gorev_tarihi=veri.gorev_tarihi,
        durum="ATANDI",
    )
    session.add(gorev)
    session.commit()
    session.refresh(gorev)
    personel_ad = _personel_ad_map(session, {gorev.personel_id})
    return _to_read(gorev, personel_ad)


def guncelle(
    session: Session,
    current_user: Kullanici,
    gorev_id: int,
    veri: TemizlikGoreviUpdate,
) -> TemizlikGoreviRead:
    gorev = session.get(TemizlikGorevi, gorev_id)
    if gorev is None:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")

    payload = veri.model_dump(exclude_unset=True)

    if _yonetim_mi(current_user):
        if "personel_id" in payload and payload["personel_id"] is not None:
            _assert_temizlik_personeli(session, payload["personel_id"])
        new_oda = payload.get("oda_bolum", gorev.oda_bolum)
        new_tarih = payload.get("gorev_tarihi", gorev.gorev_tarihi)
        if "oda_bolum" in payload or "gorev_tarihi" in payload:
            clash = session.exec(
                select(TemizlikGorevi).where(
                    TemizlikGorevi.oda_bolum == new_oda,
                    TemizlikGorevi.gorev_tarihi == new_tarih,
                    TemizlikGorevi.id != gorev_id,
                )
            ).first()
            if clash:
                raise HTTPException(status_code=409, detail="Hedef hücre dolu")
        for k, v in payload.items():
            setattr(gorev, k, v)
    else:
        personel = personel_getir(session, current_user.id)
        if gorev.personel_id != personel.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bu temizlik görevini güncelleyemezsiniz.",
            )
        if "durum" not in payload:
            raise HTTPException(
                status_code=403,
                detail="Yalnızca görev durumunu güncelleyebilirsiniz.",
            )
        gorev.durum = payload["durum"]

    gorev.updated_at = datetime.now(timezone.utc)
    session.add(gorev)
    session.commit()
    session.refresh(gorev)
    personel_ad = _personel_ad_map(session, {gorev.personel_id})
    return _to_read(gorev, personel_ad)


def sil(session: Session, current_user: Kullanici, gorev_id: int) -> None:
    if not _yonetim_mi(current_user):
        raise HTTPException(status_code=403, detail="Görev silme yetkiniz yok")
    gorev = session.get(TemizlikGorevi, gorev_id)
    if gorev is None:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    session.delete(gorev)
    session.commit()
