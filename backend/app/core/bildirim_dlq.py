"""Başarısız SMS/e-posta bildirimleri — DLQ kuyruğu."""

from __future__ import annotations

import logging
from typing import Literal

from sqlmodel import Field, Session, select

from app.core.base_model import BaseModel, utc_now

logger = logging.getLogger("hastane.bildirim.dlq")


class BildirimDlqKaydi(BaseModel, table=True):
    __tablename__ = "bildirim_dlq_kayitlari"

    kanal: str = Field(max_length=16, index=True)  # SMS | EMAIL
    hedef: str = Field(max_length=256)
    konu: str | None = Field(default=None, max_length=200)
    govde: str = Field(max_length=2000)
    durum: str = Field(default="BEKLEMEDE", max_length=32, index=True)
    deneme: int = Field(default=0)
    son_hata: str | None = Field(default=None, max_length=1000)


def dlq_ekle(
    session: Session,
    *,
    kanal: Literal["SMS", "EMAIL"],
    hedef: str,
    govde: str,
    konu: str | None = None,
    hata: str,
    commit: bool = True,
) -> None:
    session.add(
        BildirimDlqKaydi(
            kanal=kanal,
            hedef=hedef,
            konu=konu,
            govde=govde[:2000],
            durum="BEKLEMEDE",
            son_hata=hata[:1000],
        )
    )
    if commit:
        session.commit()


def isle_bekleyenler(session: Session, *, limit: int = 20) -> int:
    from app.core.config import get_settings
    from app.core.notifications import get_bildirim

    max_retry = get_settings().BILDIRIM_DLQ_MAX_RETRY
    bildirim = get_bildirim()
    rows = list(
        session.exec(
            select(BildirimDlqKaydi)
            .where(BildirimDlqKaydi.durum == "BEKLEMEDE")
            .order_by(BildirimDlqKaydi.id)
            .limit(limit)
        ).all()
    )
    done = 0
    for row in rows:
        if row.deneme >= max_retry:
            row.durum = "IPTAL"
            session.add(row)
            continue
        row.deneme += 1
        try:
            if row.kanal == "SMS":
                bildirim.sms_gonder(row.hedef, row.govde)
            else:
                bildirim.email_gonder(row.hedef, row.konu or "Bildirim", row.govde)
            row.durum = "TAMAMLANDI"
            row.son_hata = None
            done += 1
        except Exception as exc:  # noqa: BLE001
            row.son_hata = str(exc)[:1000]
            if row.deneme >= max_retry:
                row.durum = "IPTAL"
        row.updated_at = utc_now()
        session.add(row)
    session.commit()
    return done
