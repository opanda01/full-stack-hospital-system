from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.core.db import get_session
from app.core.enums import TriyajRenk
from app.core.request_ip import istemci_ip_al
from app.core.security import require_permission
from app.features.acil import service as acil_service
from app.features.kullanicilar.models import Kullanici

router = APIRouter()


class TriyajCreate(BaseModel):
    hasta_id: UUID
    sikayet_ozet: str = Field(min_length=3, max_length=2000)
    renk: TriyajRenk
    ats_skor: int | None = Field(default=None, ge=1, le=5)
    randevu_id: int | None = None
    notlar: str | None = Field(default=None, max_length=1000)


class TriyajRead(BaseModel):
    id: int
    hasta_id: int
    randevu_id: int | None
    sikayet_ozet: str
    ats_skor: int | None
    renk: str
    kaydeden_id: int
    notlar: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/triyaj", response_model=list[TriyajRead])
def list_triyaj(
    hasta_id: UUID | None = None,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("acil:triyaj")),
):
    rows = acil_service.list_triyaj(session, hasta_public_id=hasta_id)
    return [
        TriyajRead(
            id=r.id,  # type: ignore[arg-type]
            hasta_id=r.hasta_id,
            randevu_id=r.randevu_id,
            sikayet_ozet=r.sikayet_ozet,
            ats_skor=r.ats_skor,
            renk=r.renk.value if hasattr(r.renk, "value") else str(r.renk),
            kaydeden_id=r.kaydeden_id,
            notlar=r.notlar,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.post("/triyaj", response_model=TriyajRead, status_code=201)
def create_triyaj(
    body: TriyajCreate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("acil:triyaj")),
):
    row = acil_service.triyaj_kaydet(
        session,
        actor=current_user,
        hasta_public_id=body.hasta_id,
        sikayet_ozet=body.sikayet_ozet,
        renk=body.renk,
        ats_skor=body.ats_skor,
        randevu_id=body.randevu_id,
        notlar=body.notlar,
        ip_adresi=istemci_ip_al(request),
    )
    return TriyajRead(
        id=row.id,  # type: ignore[arg-type]
        hasta_id=row.hasta_id,
        randevu_id=row.randevu_id,
        sikayet_ozet=row.sikayet_ozet,
        ats_skor=row.ats_skor,
        renk=row.renk.value if hasattr(row.renk, "value") else str(row.renk),
        kaydeden_id=row.kaydeden_id,
        notlar=row.notlar,
        created_at=row.created_at,
    )
