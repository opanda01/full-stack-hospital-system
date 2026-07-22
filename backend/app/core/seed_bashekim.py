"""Başhekim paneli demo verisi (eczane, fatura, döner, entegrasyon, klinik onay)."""

from datetime import date, timedelta
from decimal import Decimal

from sqlmodel import Session, select

from app.core.enums import (
    EntegrasyonDurumKod,
    EntegrasyonSistem,
    KlinikOnayDurumu,
)
from app.features.departmanlar.models import Departman
from app.features.doner_sermaye.models import DonerSermayeKayit
from app.features.eczane.models import Ilac
from app.features.entegrasyonlar.models import EntegrasyonDurum
from app.features.faturalandirma.models import Fatura
from app.features.hastalar.models import Hasta
from app.features.klinik_onay.models import KlinikOnayKaydi
from app.features.mhrs.models import MhrsKapasite


def seed_bashekim_demo(session: Session) -> None:
    for sistem in EntegrasyonSistem:
        if not session.exec(
            select(EntegrasyonDurum).where(EntegrasyonDurum.sistem == sistem)
        ).first():
            session.add(
                EntegrasyonDurum(
                    sistem=sistem,
                    durum=EntegrasyonDurumKod.SAGLIKLI,
                )
            )

    if not session.exec(select(Ilac)).first():
        session.add(Ilac(ad="Parol 500 mg", barkod="8690001", stok=5, kritik_stok=10))
        session.add(Ilac(ad="Amoksisilin 1g", barkod="8690002", stok=120, kritik_stok=20))

    if not session.exec(select(DonerSermayeKayit)).first():
        session.add(
            DonerSermayeKayit(
                donem="2026-Q2",
                gelir=Decimal("1250000.00"),
                gider=Decimal("890000.00"),
                aciklama="Örnek dönem",
            )
        )

    hasta = session.exec(select(Hasta).limit(1)).first()
    if hasta and not session.exec(select(Fatura)).first():
        session.add(
            Fatura(
                hasta_id=hasta.id,
                tutar=Decimal("450.00"),
                durum="KESILDI",
                aciklama="Poliklinik ücreti (demo)",
            )
        )

    if not session.exec(select(KlinikOnayKaydi)).first():
        session.add(
            KlinikOnayKaydi(
                tur="RECETE",
                hasta_id=hasta.id if hasta else None,
                icerik="Parol 500 mg 2x1 — demo reçete (yapılandırılmış)",
                onay_durumu=KlinikOnayDurumu.BEKLEMEDE,
            )
        )

    dep = session.exec(select(Departman).limit(1)).first()
    if dep and not session.exec(select(MhrsKapasite)).first():
        session.add(
            MhrsKapasite(
                departman_id=dep.id,
                tarih=date.today() + timedelta(days=1),
                slot_sayisi=24,
                kaynak="MOCK",
            )
        )

    session.commit()
