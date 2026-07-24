from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, func, select

from app.core.db import get_session
from app.core.enums import MedulaGonderimDurumu
from app.core.public_id import optional_hasta_public_id_from_pk
from app.core.security import require_permission
from app.features.bashekim.router import phi_goruntuleme_logla
from app.features.faturalandirma.models import Fatura
from app.features.kullanicilar.models import Kullanici
from app.integrations.factory import get_medula

router = APIRouter()


class FaturaRead(BaseModel):
    id: int
    hasta_id: UUID | None
    tutar: Decimal
    durum: str
    aciklama: str | None
    medula_takip_no: str | None = None
    provizyon_no: str | None = None
    gonderim_durumu: str | None = None

    model_config = {"from_attributes": True}


class FaturaOzet(BaseModel):
    toplam_adet: int
    toplam_tutar: Decimal
    durum_dagilim: dict[str, int]


def _to_read(session: Session, row: Fatura) -> FaturaRead:
    return FaturaRead(
        id=row.id,  # type: ignore[arg-type]
        hasta_id=optional_hasta_public_id_from_pk(session, row.hasta_id),
        tutar=row.tutar,
        durum=row.durum,
        aciklama=row.aciklama,
        medula_takip_no=row.medula_takip_no,
        provizyon_no=row.provizyon_no,
        gonderim_durumu=row.gonderim_durumu,
    )


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
    return [
        _to_read(session, r)
        for r in session.exec(select(Fatura).order_by(Fatura.id.desc())).all()
    ]


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
    return _to_read(session, row)


@router.post("/{fatura_id}/medula-gonder", response_model=FaturaRead)
def medula_gonder(
    fatura_id: int,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("fatura:goruntule")),
):
    row = session.get(Fatura, fatura_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    res = get_medula().fatura_gonder(
        {
            "fatura_id": fatura_id,
            "tutar": str(row.tutar),
            "takip_no": row.medula_takip_no,
            "provizyon_no": row.provizyon_no,
        }
    )
    if not res.basarili:
        row.gonderim_durumu = MedulaGonderimDurumu.HATA.value
        session.add(row)
        session.commit()
        raise HTTPException(status_code=502, detail=res.mesaj or "MEDULA hata")
    row.medula_takip_no = res.takip_no
    row.provizyon_no = res.provizyon_no or row.provizyon_no
    row.gonderim_durumu = MedulaGonderimDurumu.GONDERILDI.value
    row.durum = "MEDULA_GONDERILDI"
    session.add(row)
    session.commit()
    session.refresh(row)
    return _to_read(session, row)
