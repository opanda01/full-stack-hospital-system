from datetime import date

from fastapi import APIRouter, Depends, Query, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import require_permission
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.randevular import service as randevu_service
from app.features.randevular.models import Randevu
from app.features.randevular.schemas import RandevuCreate, RandevuRead

router = APIRouter()


def _to_read(session: Session, r: Randevu) -> RandevuRead:
    ad = None
    hasta = session.get(Hasta, r.hasta_id)
    if hasta:
        k = session.get(Kullanici, hasta.kullanici_id)
        if k:
            ad = f"{k.ad} {k.soyad}".strip()
    return RandevuRead(
        id=r.id,
        hasta_id=r.hasta_id,
        doktor_id=r.doktor_id,
        departman_id=r.departman_id,
        tarih_saat=r.tarih_saat,
        durum=r.durum,
        notlar=r.notlar,
        hasta_ad_soyad=ad,
    )


@router.get("/musait", response_model=list[str])
def musait_slotlar(
    doktor_id: int = Query(...),
    tarih: date = Query(...),
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("randevu:olustur")),
):
    slots = randevu_service.musait_slotlar(session, doktor_id, tarih)
    return [s.isoformat() for s in slots]


@router.get("/", response_model=list[RandevuRead])
def randevu_listele(
    request: Request,
    current_user: Kullanici = Depends(require_permission("randevu:goruntule")),
    session: Session = Depends(get_session),
):
    rows = randevu_service.listele(session, current_user, request.state.kapsam)
    return [_to_read(session, r) for r in rows]


@router.get("/{randevu_id}", response_model=RandevuRead)
def randevu_getir(
    randevu_id: int,
    current_user: Kullanici = Depends(require_permission("randevu:goruntule")),
    session: Session = Depends(get_session),
):
    return _to_read(
        session, randevu_service.getir(session, current_user, randevu_id)
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


@router.delete("/{randevu_id}", response_model=RandevuRead)
def randevu_iptal(
    randevu_id: int,
    current_user: Kullanici = Depends(require_permission("randevu:iptal")),
    session: Session = Depends(get_session),
):
    return _to_read(
        session, randevu_service.iptal_et(session, current_user, randevu_id)
    )
