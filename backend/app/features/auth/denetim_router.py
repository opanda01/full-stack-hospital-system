"""Denetim kaydı listeleme — metadata herkese (denetim:goruntule);
detay yalnız denetim:detay (ADMIN)."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, col, select

from app.core.config import get_settings
from app.core.db import get_session
from app.core.security import require_permission
from app.features.auth.models import DenetimKaydi
from app.features.kullanicilar.models import Kullanici

router = APIRouter()
settings = get_settings()

_DEFAULT_WINDOW_DAYS = 90


class DenetimKaydiRead(BaseModel):
    id: int
    actor_id: int | None
    aksiyon: str
    kaynak: str | None
    kaynak_id: str | None
    ip_adresi: str | None
    zaman: datetime

    model_config = {"from_attributes": True}


class DenetimKaydiDetayRead(DenetimKaydiRead):
    detay: dict | None = None


def _zaman_filtre(
    q,
    *,
    zaman_bas: datetime | None,
    zaman_bit: datetime | None,
    unbounded: bool,
):
    now = datetime.now(timezone.utc)
    retention = settings.AUDIT_RETENTION_DAYS
    if not unbounded:
        if zaman_bas is None:
            zaman_bas = now - timedelta(days=_DEFAULT_WINDOW_DAYS)
        q = q.where(DenetimKaydi.zaman >= zaman_bas)
    elif retention > 0:
        cutoff = now - timedelta(days=retention)
        q = q.where(DenetimKaydi.zaman >= cutoff)
    if zaman_bit is not None:
        q = q.where(DenetimKaydi.zaman <= zaman_bit)
    return q


@router.get("/", response_model=list[DenetimKaydiRead])
def list_denetim(
    aksiyon: str | None = Query(default=None),
    kaynak: str | None = Query(default=None),
    kaynak_id: str | None = Query(default=None),
    actor_id: int | None = Query(default=None),
    zaman_bas: datetime | None = Query(default=None),
    zaman_bit: datetime | None = Query(default=None),
    unbounded: bool = Query(
        default=False,
        description="True ise varsayılan 90 gün penceresi kalkar (yalnız ADMIN)",
    ),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("denetim:goruntule")),
):
    if unbounded:
        from app.core.enums import Rol

        if current_user.rol != Rol.ADMIN:
            raise HTTPException(status_code=403, detail="Sınırsız tarih yalnız ADMIN")
    q = select(DenetimKaydi)
    q = _zaman_filtre(q, zaman_bas=zaman_bas, zaman_bit=zaman_bit, unbounded=unbounded)
    if aksiyon:
        q = q.where(DenetimKaydi.aksiyon == aksiyon)
    if kaynak:
        q = q.where(DenetimKaydi.kaynak == kaynak)
    if kaynak_id:
        q = q.where(DenetimKaydi.kaynak_id == kaynak_id)
    if actor_id is not None:
        q = q.where(DenetimKaydi.actor_id == actor_id)
    q = q.order_by(col(DenetimKaydi.zaman).desc()).limit(limit)
    return list(session.exec(q).all())


@router.get("/{kayit_id}/detay", response_model=DenetimKaydiDetayRead)
def get_denetim_detay(
    kayit_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("denetim:detay")),
):
    """PHI içerebilir — yalnız denetim:detay (ADMIN)."""
    row = session.exec(
        select(DenetimKaydi).where(DenetimKaydi.id == kayit_id)
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Denetim kaydı bulunamadı")
    return DenetimKaydiDetayRead(
        id=row.id,
        actor_id=row.actor_id,
        aksiyon=row.aksiyon,
        kaynak=row.kaynak,
        kaynak_id=row.kaynak_id,
        ip_adresi=row.ip_adresi,
        zaman=row.zaman,
        detay=row.detay,
    )
