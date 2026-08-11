"""Plan demo seed — aşı kayıtları ve zorunlu bildirim örneği."""

from datetime import date, timedelta

from sqlmodel import Session, select

from app.core.seed_rbac import DEMO_HASTA_EMAIL
from app.features.hastalar.asi_models import HastaAsiKaydi
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.muayeneler.models import MuayeneKaydi
from app.features.randevular.models import Randevu


def seed_plan_demo(session: Session) -> None:
    kullanici = session.exec(
        select(Kullanici).where(Kullanici.email == DEMO_HASTA_EMAIL)
    ).first()
    hasta = None
    if kullanici is not None:
        hasta = session.exec(
            select(Hasta).where(Hasta.kullanici_id == kullanici.id)
        ).first()
    if hasta is None:
        hasta = session.exec(select(Hasta).order_by(Hasta.id)).first()
    if hasta is None or hasta.id is None:
        session.commit()
        return

    asi_seed = [
        ("Grip aşısı", date.today() - timedelta(days=120), date.today() + timedelta(days=245)),
        ("Hepatit B", date.today() - timedelta(days=400), None),
        ("COVID-19 hatırlatma", date.today() - timedelta(days=30), date.today() + timedelta(days=335)),
    ]
    for ad, uyg, sonraki in asi_seed:
        mevcut = session.exec(
            select(HastaAsiKaydi).where(
                HastaAsiKaydi.hasta_id == hasta.id,
                HastaAsiKaydi.asi_adi == ad,
            )
        ).first()
        if mevcut is None:
            session.add(
                HastaAsiKaydi(
                    hasta_id=hasta.id,
                    asi_adi=ad,
                    uygulama_tarihi=uyg,
                    sonraki_tarih=sonraki,
                    uygulayan="Demo poliklinik",
                )
            )

    muayene = session.exec(
        select(MuayeneKaydi)
        .join(Randevu, MuayeneKaydi.randevu_id == Randevu.id)
        .where(Randevu.hasta_id == hasta.id)
        .order_by(MuayeneKaydi.id.desc())
    ).first()
    if muayene is not None and not muayene.bulasici_bildirim_mi:
        muayene.bulasici_bildirim_mi = True
        session.add(muayene)

    session.commit()
