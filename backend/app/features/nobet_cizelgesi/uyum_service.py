"""Nöbet atama uyum kuralları — haftalık saat üst limiti."""

from datetime import date, timedelta

from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.config import get_settings
from app.features.nobet_cizelgesi.models import NobetCizelgesi

VARDIYA_SAAT: dict[str, int] = {
    "SABAH": 8,
    "AKSAM": 8,
    "GECE": 12,
}


def _vardiya_saat(vardiya: str) -> int:
    return VARDIYA_SAAT.get(vardiya.upper(), 8)


def _hafta_baslangic(tarih: date) -> date:
    return tarih - timedelta(days=tarih.weekday())


def dogrula_nobet_atamasi(
    session: Session,
    *,
    personel_id: int,
    tarih: date,
    vardiya: str,
    exclude_nobet_id: int | None = None,
) -> None:
    max_saat = int(get_settings().NOBET_HAFTALIK_SAAT_LIMIT)
    hafta_bas = _hafta_baslangic(tarih)
    hafta_bit = hafta_bas + timedelta(days=6)

    q = select(NobetCizelgesi).where(
        NobetCizelgesi.personel_id == personel_id,
        NobetCizelgesi.tarih >= hafta_bas,
        NobetCizelgesi.tarih <= hafta_bit,
    )
    if exclude_nobet_id is not None:
        q = q.where(NobetCizelgesi.id != exclude_nobet_id)

    toplam = 0
    for row in session.exec(q).all():
        toplam += _vardiya_saat(row.vardiya)

    yeni = _vardiya_saat(vardiya)
    if toplam + yeni > max_saat:
        raise HTTPException(
            status_code=400,
            detail=f"Haftalık nöbet süresi limiti aşılıyor (max {max_saat} saat)",
        )

    gunluk_q = select(NobetCizelgesi).where(
        NobetCizelgesi.personel_id == personel_id,
        NobetCizelgesi.tarih == tarih,
        NobetCizelgesi.vardiya == vardiya,
    )
    if exclude_nobet_id is not None:
        gunluk_q = gunluk_q.where(NobetCizelgesi.id != exclude_nobet_id)
    if session.exec(gunluk_q).first() is not None:
        raise HTTPException(
            status_code=409,
            detail="Personelin aynı gün ve vardiyada zaten nöbeti var",
        )
