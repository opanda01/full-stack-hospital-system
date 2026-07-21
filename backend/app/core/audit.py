"""Denetim kaydı yazma yardımcısı."""

from typing import Any

from sqlmodel import Session

from app.features.auth.models import DenetimKaydi


def denetim_kaydi_yaz(
    session: Session,
    *,
    aksiyon: str,
    actor_id: int | None = None,
    kaynak: str | None = None,
    kaynak_id: str | int | None = None,
    ip_adresi: str | None = None,
    detay: dict[str, Any] | None = None,
    commit: bool = True,
) -> DenetimKaydi:
    kayit = DenetimKaydi(
        actor_id=actor_id,
        aksiyon=aksiyon,
        kaynak=kaynak,
        kaynak_id=str(kaynak_id) if kaynak_id is not None else None,
        ip_adresi=ip_adresi,
        detay=detay,
    )
    session.add(kayit)
    if commit:
        session.commit()
        session.refresh(kayit)
    else:
        session.flush()
    return kayit
