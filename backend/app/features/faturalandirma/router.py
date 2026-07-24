from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, func, select

from app.core.batch_load import batch_by_ids
from app.core.db import get_session
from app.core.enums import MedulaGonderimDurumu
from app.core.pagination import Page, PaginationParams, get_pagination, make_page, paginate
from app.core.security import require_permission
from app.features.bashekim.router import phi_goruntuleme_logla
from app.features.faturalandirma.models import Fatura
from app.features.hastalar.models import Hasta
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


def _to_read_maps(row: Fatura, hastalar: dict[int, Hasta]) -> FaturaRead:
    hasta = hastalar.get(row.hasta_id) if row.hasta_id else None
    return FaturaRead(
        id=row.id,  # type: ignore[arg-type]
        hasta_id=hasta.public_id if hasta else None,
        tutar=row.tutar,
        durum=row.durum,
        aciklama=row.aciklama,
        medula_takip_no=row.medula_takip_no,
        provizyon_no=row.provizyon_no,
        gonderim_durumu=row.gonderim_durumu,
    )


def _to_read(session: Session, row: Fatura) -> FaturaRead:
    hastalar = batch_by_ids(session, Hasta, [row.hasta_id] if row.hasta_id else [])
    return _to_read_maps(row, hastalar)


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


@router.get("/", response_model=Page[FaturaRead])
def list_faturalar(
    pagination: PaginationParams = Depends(get_pagination),
    session: Session = Depends(get_session),
    _user=Depends(require_permission("fatura:goruntule")),
):
    q = select(Fatura).order_by(Fatura.id.desc())
    rows, total = paginate(
        session, q, page=pagination.page, page_size=pagination.page_size
    )
    hastalar = batch_by_ids(session, Hasta, (r.hasta_id for r in rows))
    return make_page(
        [_to_read_maps(r, hastalar) for r in rows],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )


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
