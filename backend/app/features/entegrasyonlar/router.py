from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.db import get_session
from app.core.enums import EntegrasyonDurumKod, EntegrasyonSistem
from app.core.request_ip import istemci_ip_al
from app.core.security import require_permission
from app.features.entegrasyonlar.models import EntegrasyonDurum
from app.features.kullanicilar.models import Kullanici

router = APIRouter()


class EntegrasyonDurumRead(BaseModel):
    id: int
    sistem: str
    durum: str
    son_senkron: datetime | None
    hata_ozeti: str | None

    model_config = {"from_attributes": True}


def _ensure_defaults(session: Session) -> None:
    for sistem in EntegrasyonSistem:
        existing = session.exec(
            select(EntegrasyonDurum).where(EntegrasyonDurum.sistem == sistem)
        ).first()
        if existing is None:
            session.add(
                EntegrasyonDurum(
                    sistem=sistem, durum=EntegrasyonDurumKod.BILINMIYOR
                )
            )
    session.commit()


@router.get("/", response_model=list[EntegrasyonDurumRead])
def list_entegrasyonlar(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("entegrasyon:goruntule")),
):
    _ensure_defaults(session)
    rows = list(session.exec(select(EntegrasyonDurum)).all())
    return [
        EntegrasyonDurumRead(
            id=r.id,
            sistem=r.sistem.value if hasattr(r.sistem, "value") else str(r.sistem),
            durum=r.durum.value if hasattr(r.durum, "value") else str(r.durum),
            son_senkron=r.son_senkron,
            hata_ozeti=r.hata_ozeti,
        )
        for r in rows
    ]


@router.post("/{sistem}/senkron", response_model=EntegrasyonDurumRead)
def senkron_entegrasyon(
    sistem: EntegrasyonSistem,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("entegrasyon:goruntule")),
):
    _ensure_defaults(session)
    row = session.exec(
        select(EntegrasyonDurum).where(EntegrasyonDurum.sistem == sistem)
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Entegrasyon bulunamadı")
    # Mock: her zaman sağlıklı
    row.durum = EntegrasyonDurumKod.SAGLIKLI
    row.son_senkron = datetime.utcnow()
    row.hata_ozeti = None
    session.add(row)
    denetim_kaydi_yaz(
        session,
        aksiyon="ENTEGRASYON_SENKRON_MOCK",
        actor_id=current_user.id,
        kaynak="entegrasyon",
        kaynak_id=sistem.value,
        ip_adresi=istemci_ip_al(request),
        commit=False,
    )
    session.commit()
    session.refresh(row)
    return EntegrasyonDurumRead(
        id=row.id,
        sistem=row.sistem.value if hasattr(row.sistem, "value") else str(row.sistem),
        durum=row.durum.value if hasattr(row.durum, "value") else str(row.durum),
        son_senkron=row.son_senkron,
        hata_ozeti=row.hata_ozeti,
    )
