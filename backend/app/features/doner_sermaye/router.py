from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

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


@router.get("/", response_model=list[DonerRead])
def list_doner(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("doner:goruntule")),
):
    rows = list(session.exec(select(DonerSermayeKayit).order_by(DonerSermayeKayit.donem.desc())).all())
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
