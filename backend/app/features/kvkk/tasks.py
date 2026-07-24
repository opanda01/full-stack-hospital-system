"""Celery: PHI retention / anonimleştirme."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.core.crypto import encrypt_phi, hmac_tc, phi_encrypt_enabled
from app.core.db import engine
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici


@celery_app.task(name="phi_retention.anonimlestir")
def anonimlestir(limit: int = 100) -> dict:
    settings = get_settings()
    years = settings.HASTA_RETENTION_YEARS
    cutoff = datetime.now(timezone.utc) - timedelta(days=365 * years)
    etkilenen = 0

    with Session(engine) as session:
        q = (
            select(Hasta)
            .where(Hasta.anonymized_at.is_(None))  # type: ignore[union-attr]
            .where(Hasta.updated_at < cutoff)
            .limit(limit)
        )
        rows = list(session.exec(q).all())
        for h in rows:
            assert h.id is not None
            anon_tc = f"ANON{str(h.public_id).replace('-', '')[:7]}"
            if phi_encrypt_enabled():
                h.tc_kimlik_no = encrypt_phi(anon_tc) or anon_tc
                h.adres = encrypt_phi("ANONIM")
            else:
                h.tc_kimlik_no = anon_tc
                h.adres = "ANONIM"
            h.tc_kimlik_no_hash = hmac_tc(anon_tc)
            h.tc_kimlik_no_hash_prev = None
            h.anonymized_at = datetime.now(timezone.utc)

            k = session.get(Kullanici, h.kullanici_id)
            if k:
                k.ad = "ANONIM"
                k.soyad = "ANONIM"
                if phi_encrypt_enabled():
                    k.tc_kimlik_no = encrypt_phi(anon_tc) or anon_tc
                else:
                    k.tc_kimlik_no = anon_tc
                k.telefon = None
                k.email = f"anon-{h.public_id}@invalid.local"
                session.add(k)

            # OTP scrub
            session.execute(
                text(
                    "UPDATE otp_kodlari SET tc_kimlik_no = 'ANON', telefon = '0000000000' "
                    "WHERE tc_kimlik_no IS NOT NULL AND length(tc_kimlik_no) = 11"
                )
            )

            session.add(h)
            denetim_kaydi_yaz(
                session,
                aksiyon="PHI_ANONIMLESTIRME",
                actor_id=None,
                kaynak="hastalar",
                kaynak_id=h.id,
                detay={
                    "hasta_public_id": str(h.public_id),
                    "tablolar": ["hastalar", "kullanicilar", "otp_kodlari"],
                },
                commit=False,
            )
            etkilenen += 1
        session.commit()
    return {"anonimlestirilen": etkilenen}
