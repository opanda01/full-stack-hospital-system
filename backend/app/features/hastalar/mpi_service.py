"""MPI: mükerrer aday sorgusu ve kontrollü merge istekleri."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.base_model import utc_now
from app.core.crypto import hmac_lookup_values, phi_encrypt_enabled
from app.core.tc_kimlik import gecerli_tc_kimlik_no
from app.features.hastalar.models import Hasta
from app.features.hastalar.mpi_models import HastaMukerrerIstegi
from app.features.kullanicilar.models import Kullanici


def mukerrer_adaylar(session: Session, tc_kimlik_no: str) -> list[Hasta]:
    tc = tc_kimlik_no.strip()
    if not gecerli_tc_kimlik_no(tc):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Geçersiz TC kimlik numarası",
        )
    conds = [Hasta.tc_kimlik_no == tc]
    hash_vals = hmac_lookup_values(tc) if phi_encrypt_enabled() else []
    if hash_vals:
        conds.append(Hasta.tc_kimlik_no_hash.in_(hash_vals))  # type: ignore[arg-type]
        conds.append(Hasta.tc_kimlik_no_hash_prev.in_(hash_vals))  # type: ignore[arg-type]
    rows = list(
        session.exec(
            select(Hasta).where(
                or_(*conds),
                Hasta.merged_into_hasta_id.is_(None),  # type: ignore[union-attr]
            )
        ).all()
    )
    return rows


def mukerrer_istek_olustur(
    session: Session,
    *,
    actor: Kullanici,
    kaynak_hasta_id: int,
    hedef_hasta_id: int,
    gerekce: str,
    ip_adresi: str | None = None,
) -> HastaMukerrerIstegi:
    if kaynak_hasta_id == hedef_hasta_id:
        raise HTTPException(status_code=400, detail="Kaynak ve hedef hasta aynı olamaz")
    if len(gerekce.strip()) < 10:
        raise HTTPException(status_code=422, detail="Gerekçe en az 10 karakter olmalı")
    kaynak = session.get(Hasta, kaynak_hasta_id)
    hedef = session.get(Hasta, hedef_hasta_id)
    if kaynak is None or hedef is None:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")
    if kaynak.merged_into_hasta_id is not None:
        raise HTTPException(status_code=400, detail="Kaynak hasta zaten birleştirilmiş")
    if hedef.merged_into_hasta_id is not None:
        raise HTTPException(status_code=400, detail="Hedef hasta zaten birleştirilmiş")

    row = HastaMukerrerIstegi(
        kaynak_hasta_id=kaynak_hasta_id,
        hedef_hasta_id=hedef_hasta_id,
        gerekce=gerekce.strip(),
        olusturan_id=actor.id,  # type: ignore[arg-type]
        durum="BEKLEMEDE",
    )
    session.add(row)
    denetim_kaydi_yaz(
        session,
        aksiyon="MPI_MUKERRER_ISTEK",
        actor_id=actor.id,
        kaynak="hasta_mukerrer",
        detay={
            "kaynak_hasta_id": kaynak_hasta_id,
            "hedef_hasta_id": hedef_hasta_id,
        },
        ip_adresi=ip_adresi,
        commit=False,
    )
    session.commit()
    session.refresh(row)
    return row


def mukerrer_istek_onayla(
    session: Session,
    *,
    actor: Kullanici,
    istek_id: int,
    ip_adresi: str | None = None,
) -> HastaMukerrerIstegi:
    """Kaynak hastayı hedefe işaretler (FK taşıma sonraki faz; iskelet)."""
    row = session.get(HastaMukerrerIstegi, istek_id)
    if row is None:
        raise HTTPException(status_code=404, detail="İstek bulunamadı")
    if row.durum != "BEKLEMEDE":
        raise HTTPException(status_code=400, detail="İstek zaten sonuçlanmış")
    kaynak = session.get(Hasta, row.kaynak_hasta_id)
    if kaynak is None:
        raise HTTPException(status_code=404, detail="Kaynak hasta bulunamadı")
    kaynak.merged_into_hasta_id = row.hedef_hasta_id
    kaynak.anonymized_at = utc_now()
    session.add(kaynak)
    row.durum = "ONAYLANDI"
    row.onaylayan_id = actor.id
    row.karar_tarihi = utc_now()
    session.add(row)
    denetim_kaydi_yaz(
        session,
        aksiyon="MPI_MERGE_ONAY",
        actor_id=actor.id,
        kaynak="hasta_mukerrer",
        kaynak_id=istek_id,
        detay={
            "kaynak_hasta_id": row.kaynak_hasta_id,
            "hedef_hasta_id": row.hedef_hasta_id,
        },
        ip_adresi=ip_adresi,
        commit=False,
    )
    session.commit()
    session.refresh(row)
    return row
