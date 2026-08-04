"""Sevk onayı: aile hekimi sevk doğrulama ve katkı payı satırı."""

from decimal import Decimal

from sqlmodel import Session

from app.core.config import get_settings
from app.features.faturalandirma.models import Fatura, FaturaKalemi
from app.features.klinik_onay.models import KlinikOnayKaydi


def aile_hekimi_sevk_gecerli_mi(sevk_no: str | None) -> bool:
    s = (sevk_no or "").strip()
    return len(s) >= 5


def sevk_onay_ek_ucret_uygula(session: Session, row: KlinikOnayKaydi) -> Fatura | None:
    if row.tur != "SEVK" or row.hasta_id is None:
        return None
    if aile_hekimi_sevk_gecerli_mi(row.aile_hekimi_sevk_no):
        return None

    tutar = Decimal(str(get_settings().SEVK_KATKI_PAYI_TUTAR))
    fatura = Fatura(
        hasta_id=row.hasta_id,
        tutar=tutar,
        durum="TASLAK",
        aciklama=f"Sevk katkı payı (klinik onay {row.id})",
        gonderim_durumu="BEKLEMEDE",
    )
    session.add(fatura)
    session.flush()
    session.add(
        FaturaKalemi(
            fatura_id=fatura.id,
            kod="SEVK_KATKI_PAYI",
            aciklama="Aile hekimi sevk belgesi olmadan sevk onayı",
            tutar=tutar,
        )
    )
    return fatura
