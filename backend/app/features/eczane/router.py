from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.security import require_permission
from app.features.eczane.models import Ilac

router = APIRouter()


class IlacRead(BaseModel):
    id: int
    ad: str
    barkod: str | None
    stok: int
    kritik_stok: int
    kritik_mi: bool = False

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[IlacRead])
def list_ilaclar(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("eczane:goruntule")),
):
    rows = list(session.exec(select(Ilac).order_by(Ilac.ad)).all())
    return [
        IlacRead(
            id=r.id,
            ad=r.ad,
            barkod=r.barkod,
            stok=r.stok,
            kritik_stok=r.kritik_stok,
            kritik_mi=r.stok <= r.kritik_stok,
        )
        for r in rows
    ]
