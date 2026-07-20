from datetime import date

from fastapi import APIRouter, Depends, Query, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.randevular import service as randevu_service
from app.features.randevular.schemas import RandevuCreate, RandevuRead

router = APIRouter()


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
    return randevu_service.listele(session, current_user, request.state.kapsam)


@router.get("/{randevu_id}", response_model=RandevuRead)
def randevu_getir(
    randevu_id: int,
    current_user: Kullanici = Depends(require_permission("randevu:goruntule")),
    session: Session = Depends(get_session),
):
    return randevu_service.getir(session, current_user, randevu_id)


@router.post("/", response_model=RandevuRead, status_code=status.HTTP_201_CREATED)
def randevu_olustur(
    veri: RandevuCreate,
    request: Request,
    current_user: Kullanici = Depends(require_permission("randevu:olustur")),
    session: Session = Depends(get_session),
):
    return randevu_service.olustur(session, current_user, veri, request.state.kapsam)


@router.delete("/{randevu_id}", response_model=RandevuRead)
def randevu_iptal(
    randevu_id: int,
    current_user: Kullanici = Depends(require_permission("randevu:iptal")),
    session: Session = Depends(get_session),
):
    return randevu_service.iptal_et(session, current_user, randevu_id)
