from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, func, select

from app.core.db import get_session
from app.core.security import require_permission
from app.features.bashekim.router import phi_goruntuleme_logla
from app.features.faturalandirma.models import Fatura
from app.features.kullanicilar.models import Kullanici

router = APIRouter()


class FaturaRead(BaseModel):
    id: int
    hasta_id: int | None
    tutar: Decimal
    durum: str
    aciklama: str | None

    model_config = {"from_attributes": True}


class FaturaOzet(BaseModel):
    toplam_adet: int
    toplam_tutar: Decimal
    durum_dagilim: dict[str, int]


@router.get("/ozet", response_model=FaturaOzet)
def fatura_ozet(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("fatura:goruntule")),
):
    toplam_adet = int(session.exec(select(func.count()).select_from(Fatura)).one() or 0)
    toplam_tutar = session.exec(select(func.coalesce(func.sum(Fatura.tutar), 0))).one()
    rows = session.exec(
        select(Fatura.durum, func.count()).group_by(Fatura.durum)
    ).all()
    dagilim = {str(d): int(c) for d, c in rows}
    return FaturaOzet(
        toplam_adet=toplam_adet,
        toplam_tutar=Decimal(str(toplam_tutar or 0)),
        durum_dagilim=dagilim,
    )


@router.get("/", response_model=list[FaturaRead])
def list_faturalar(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("fatura:goruntule")),
):
    return list(session.exec(select(Fatura).order_by(Fatura.id.desc())).all())


@router.get("/{fatura_id}", response_model=FaturaRead)
def get_fatura(
    fatura_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("fatura:goruntule")),
):
    row = session.get(Fatura, fatura_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    if row.hasta_id:
        phi_goruntuleme_logla(
            session,
            actor=current_user,
            kaynak="fatura",
            kaynak_id=fatura_id,
            request=request,
        )
    return row
