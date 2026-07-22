"""Denetim kaydı listeleme (ADMIN)."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, col, select

from app.core.config import get_settings
from app.core.db import get_session
from app.core.enums import Rol
from app.core.security import require_role
from app.features.auth.models import DenetimKaydi

router = APIRouter()
settings = get_settings()


class DenetimKaydiRead(BaseModel):
    id: int
    actor_id: int | None
    aksiyon: str
    kaynak: str | None
    kaynak_id: str | None
    ip_adresi: str | None
    zaman: datetime

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[DenetimKaydiRead])
def list_denetim(
    aksiyon: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(get_session),
    _user=Depends(require_role(Rol.ADMIN)),
):
    retention = settings.AUDIT_RETENTION_DAYS
    q = select(DenetimKaydi)
    if retention > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=retention)
        q = q.where(DenetimKaydi.zaman >= cutoff)
    if aksiyon:
        q = q.where(DenetimKaydi.aksiyon == aksiyon)
    q = q.order_by(col(DenetimKaydi.zaman).desc()).limit(limit)
    return list(session.exec(q).all())
