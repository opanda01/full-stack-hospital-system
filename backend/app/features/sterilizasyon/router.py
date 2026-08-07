from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.sterilizasyon.models import SterilizasyonCihaz
from app.features.sterilizasyon.schemas import CihazCreate, CihazGuncelle, CihazRead

router = APIRouter()


@router.get("/cihazlar", response_model=list[CihazRead])
def list_cihazlar(
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("sterilizasyon:goruntule")),
):
    rows = session.exec(select(SterilizasyonCihaz).order_by(SterilizasyonCihaz.ad)).all()
    return [CihazRead.model_validate(r) for r in rows]


@router.post("/cihazlar", response_model=CihazRead, status_code=201)
def create_cihaz(
    body: CihazCreate,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("sterilizasyon:olustur")),
):
    row = SterilizasyonCihaz(**body.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)
    return CihazRead.model_validate(row)


@router.patch("/cihazlar/{cihaz_id}", response_model=CihazRead)
def patch_cihaz(
    cihaz_id: int,
    body: CihazGuncelle,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("sterilizasyon:guncelle")),
):
    row = session.get(SterilizasyonCihaz, cihaz_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    session.add(row)
    session.commit()
    session.refresh(row)
    return CihazRead.model_validate(row)
