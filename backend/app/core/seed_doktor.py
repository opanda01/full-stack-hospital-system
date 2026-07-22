"""Doktor paneli örnek klinik verileri (idempotent)."""

from datetime import datetime, timezone

from sqlmodel import Session, select

from app.core.enums import KlinikOnayDurumu, KonsultasyonDurumu
from app.features.doktorlar.models import Doktor
from app.features.hastalar.models import Hasta
from app.features.klinik_onay.models import KlinikOnayKaydi
from app.features.konsultasyon.models import KonsultasyonIstegi
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.saglik_kurulu.models import SaglikKuruluKaydi, SaglikKuruluUye


def seed_doktor_panel(session: Session) -> None:
    doktorlar = list(session.exec(select(Doktor)).all())
    if len(doktorlar) < 1:
        return
    d1 = doktorlar[0]
    d2 = doktorlar[1] if len(doktorlar) > 1 else d1
    hasta = session.exec(select(Hasta)).first()
    if hasta is None:
        return

    p1 = session.get(Personel, d1.personel_id)
    olusturan = session.get(Kullanici, p1.kullanici_id) if p1 else None

    existing = session.exec(
        select(KlinikOnayKaydi).where(
            KlinikOnayKaydi.icerik == "SEED: Parasetamol 500 mg"
        )
    ).first()
    if existing is None and olusturan:
        session.add(
            KlinikOnayKaydi(
                tur="RECETE",
                hasta_id=hasta.id,
                icerik="SEED: Parasetamol 500 mg",
                onay_durumu=KlinikOnayDurumu.BEKLEMEDE,
                olusturan_id=olusturan.id,
            )
        )

    if d1.id != d2.id:
        k_exist = session.exec(
            select(KonsultasyonIstegi).where(
                KonsultasyonIstegi.notlar == "SEED konsültasyon"
            )
        ).first()
        if k_exist is None:
            session.add(
                KonsultasyonIstegi(
                    isteyen_doktor_id=d1.id,
                    hedef_doktor_id=d2.id,
                    hasta_id=hasta.id,
                    notlar="SEED konsültasyon",
                    durum=KonsultasyonDurumu.KABUL,
                    yanit_tarihi=datetime.now(timezone.utc),
                )
            )

    kurul = session.exec(
        select(SaglikKuruluKaydi).where(SaglikKuruluKaydi.baslik == "SEED Kurul")
    ).first()
    if kurul is None:
        kurul = SaglikKuruluKaydi(
            baslik="SEED Kurul",
            hasta_id=hasta.id,
            karar_ozeti="Seed örnek kurul kararı",
            durum="ACIK",
        )
        session.add(kurul)
        session.flush()
        session.add(SaglikKuruluUye(kurul_id=kurul.id, doktor_id=d1.id))
        if d2.id != d1.id:
            session.add(SaglikKuruluUye(kurul_id=kurul.id, doktor_id=d2.id))

    session.commit()
