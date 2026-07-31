from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, status
from sqlmodel import Session

from app.core.batch_load import batch_by_ids
from app.core.db import get_session
from app.core.pagination import Page, PaginationParams, get_pagination, make_page, paginate
from app.core.security import require_permission
from app.core.timezone import to_istanbul
from app.features.departmanlar.models import Departman
from app.features.doktorlar.models import Doktor
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.randevular import service as randevu_service
from app.features.randevular.models import Randevu
from app.features.randevular.schemas import RandevuCreate, RandevuRead

router = APIRouter()


def _to_read_maps(
    r: Randevu,
    *,
    hastalar: dict[int, Hasta],
    kullanicilar: dict[int, Kullanici],
    doktorlar: dict[int, Doktor],
    personeller: dict[int, Personel],
    departmanlar: dict[int, Departman],
) -> RandevuRead:
    hasta = hastalar.get(r.hasta_id)
    if hasta is None:
        raise ValueError("Randevu hasta kaydı bulunamadı")
    k = kullanicilar.get(hasta.kullanici_id)
    ad = f"{k.ad} {k.soyad}".strip() if k else None
    doktor = doktorlar.get(r.doktor_id)
    doktor_ad = None
    if doktor:
        personel = personeller.get(doktor.personel_id)
        if personel:
            dk = kullanicilar.get(personel.kullanici_id)
            doktor_ad = f"{dk.ad} {dk.soyad}".strip() if dk else None
    dep = departmanlar.get(r.departman_id)
    return RandevuRead(
        id=r.public_id,
        hasta_id=hasta.public_id,
        doktor_id=r.doktor_id,
        departman_id=r.departman_id,
        tarih_saat=to_istanbul(r.tarih_saat),
        durum=r.durum,
        notlar=r.notlar,
        hasta_ad_soyad=ad,
        doktor_ad_soyad=doktor_ad,
        departman_ad=dep.ad if dep else None,
    )


def _to_read(session: Session, r: Randevu) -> RandevuRead:
    return _rows_to_read(session, [r])[0]


def _rows_to_read(session: Session, rows: list[Randevu]) -> list[RandevuRead]:
    hastalar = batch_by_ids(session, Hasta, (r.hasta_id for r in rows))
    doktorlar = batch_by_ids(session, Doktor, (r.doktor_id for r in rows))
    personeller = batch_by_ids(
        session, Personel, (d.personel_id for d in doktorlar.values())
    )
    departmanlar = batch_by_ids(session, Departman, (r.departman_id for r in rows))
    kullanici_ids = {h.kullanici_id for h in hastalar.values()}
    kullanici_ids.update(p.kullanici_id for p in personeller.values())
    kullanicilar = batch_by_ids(session, Kullanici, kullanici_ids)
    return [
        _to_read_maps(
            r,
            hastalar=hastalar,
            kullanicilar=kullanicilar,
            doktorlar=doktorlar,
            personeller=personeller,
            departmanlar=departmanlar,
        )
        for r in rows
    ]


@router.get("/musait", response_model=list[str])
def musait_slotlar(
    doktor_id: int = Query(...),
    tarih: date = Query(...),
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("randevu:olustur")),
):
    slots = randevu_service.musait_slotlar(session, doktor_id, tarih)
    return [s.isoformat() for s in slots]


@router.get("/", response_model=Page[RandevuRead])
def randevu_listele(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination),
    current_user: Kullanici = Depends(require_permission("randevu:goruntule")),
    session: Session = Depends(get_session),
):
    q = randevu_service.listele_sorgu(session, current_user, request.state.kapsam)
    rows, total = paginate(
        session, q, page=pagination.page, page_size=pagination.page_size
    )
    return make_page(
        _rows_to_read(session, rows),
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get("/{public_id}", response_model=RandevuRead)
def randevu_getir(
    public_id: UUID,
    current_user: Kullanici = Depends(require_permission("randevu:goruntule")),
    session: Session = Depends(get_session),
):
    return _to_read(
        session, randevu_service.getir(session, current_user, public_id)
    )


@router.post("/", response_model=RandevuRead, status_code=status.HTTP_201_CREATED)
def randevu_olustur(
    veri: RandevuCreate,
    request: Request,
    current_user: Kullanici = Depends(require_permission("randevu:olustur")),
    session: Session = Depends(get_session),
):
    r = randevu_service.olustur(session, current_user, veri, request.state.kapsam)
    return _to_read(session, r)


@router.delete("/{public_id}", response_model=RandevuRead)
def randevu_iptal(
    public_id: UUID,
    current_user: Kullanici = Depends(require_permission("randevu:iptal")),
    session: Session = Depends(get_session),
):
    return _to_read(
        session, randevu_service.iptal_et(session, current_user, public_id)
    )
