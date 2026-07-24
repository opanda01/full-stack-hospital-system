from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, func, select

from app.core.db import get_session
from app.core.security import require_permission
from app.features.doner_sermaye.models import DonerSermayeKayit

router = APIRouter()


class DonerRead(BaseModel):
    id: int
    donem: str
    gelir: Decimal
    gider: Decimal
    net: Decimal = Decimal("0")
    aciklama: str | None

    model_config = {"from_attributes": True}


class DonerOzet(BaseModel):
    donem_sayisi: int
    toplam_gelir: Decimal
    toplam_gider: Decimal
    net: Decimal


@router.get("/ozet", response_model=DonerOzet)
def doner_ozet(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("doner:goruntule")),
):
    donem_sayisi = int(
        session.exec(select(func.count()).select_from(DonerSermayeKayit)).one() or 0
    )
    gelir = session.exec(
        select(func.coalesce(func.sum(DonerSermayeKayit.gelir), 0))
    ).one()
    gider = session.exec(
        select(func.coalesce(func.sum(DonerSermayeKayit.gider), 0))
    ).one()
    g = Decimal(str(gelir or 0))
    c = Decimal(str(gider or 0))
    return DonerOzet(
        donem_sayisi=donem_sayisi,
        toplam_gelir=g,
        toplam_gider=c,
        net=g - c,
    )


@router.get("/", response_model=list[DonerRead])
def list_doner(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("doner:goruntule")),
):
    rows = list(
        session.exec(
            select(DonerSermayeKayit).order_by(DonerSermayeKayit.donem.desc())
        ).all()
    )
    return [
        DonerRead(
            id=r.id,
            donem=r.donem,
            gelir=r.gelir,
            gider=r.gider,
            net=r.gelir - r.gider,
            aciklama=r.aciklama,
        )
        for r in rows
    ]
