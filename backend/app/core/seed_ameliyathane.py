"""Ameliyathane demo: 2 oda + örnek planlı ameliyatlar (idempotent)."""

from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from app.core.enums import AmeliyathaneDurumu, AmeliyatPlaniDurumu
from app.features.ameliyathane.models import Ameliyathane, AmeliyatPlani
from app.features.doktorlar.models import Doktor
from app.features.hastalar.models import Hasta
from app.features.personel.models import Personel


def seed_ameliyathane_demo(session: Session) -> None:
    if session.exec(select(Ameliyathane).where(Ameliyathane.oda_no == "AMEL-1")).first():
        return

    a1 = Ameliyathane(
        ad="Ameliyathane 1",
        oda_no="AMEL-1",
        durum=AmeliyathaneDurumu.MUSAIT,
    )
    a2 = Ameliyathane(
        ad="Ameliyathane 2",
        oda_no="AMEL-2",
        durum=AmeliyathaneDurumu.MUSAIT,
    )
    session.add(a1)
    session.add(a2)
    session.flush()

    doktor = session.exec(select(Doktor)).first()
    hasta = session.exec(select(Hasta)).first()
    if doktor is None or hasta is None:
        session.commit()
        return

    personel = session.get(Personel, doktor.personel_id)
    if personel is None:
        session.commit()
        return

    bas = datetime.now(timezone.utc).replace(hour=9, minute=0, second=0, microsecond=0)
    if bas.weekday() >= 5:
        bas += timedelta(days=(7 - bas.weekday()))

    p1 = AmeliyatPlani(
        hasta_id=hasta.id,
        ameliyathane_id=a1.id,
        sorumlu_cerrah_id=personel.id,
        planlanan_baslangic=bas + timedelta(days=1),
        planlanan_sure_dk=120,
        ameliyat_adi="SEED: Laparoskopik kolesistektomi",
        durum=AmeliyatPlaniDurumu.PLANLANDI,
    )
    p2 = AmeliyatPlani(
        hasta_id=hasta.id,
        ameliyathane_id=a2.id,
        sorumlu_cerrah_id=personel.id,
        planlanan_baslangic=bas + timedelta(days=2, hours=2),
        planlanan_sure_dk=90,
        ameliyat_adi="SEED: Artroskopi diz",
        durum=AmeliyatPlaniDurumu.PLANLANDI,
    )
    session.add(p1)
    session.add(p2)
    session.commit()
