"""Radyoloji demo istemi (idempotent)."""

from sqlmodel import Session, select

from app.core.enums import (
    RadyolojiAciliyet,
    RadyolojiIstemDurumu,
    RadyolojiTetkikTuru,
)
from app.features.doktorlar.models import Doktor
from app.features.hastalar.models import Hasta
from app.features.radyoloji.models import RadyolojiIstemi


def seed_radyoloji_demo(session: Session) -> None:
    if session.exec(
        select(RadyolojiIstemi).where(
            RadyolojiIstemi.vucut_bolgesi == "SEED göğüs PA"
        )
    ).first():
        return

    doktor = session.exec(select(Doktor)).first()
    hasta = session.exec(select(Hasta)).first()
    if doktor is None or hasta is None:
        return

    session.add(
        RadyolojiIstemi(
            hasta_id=hasta.id,
            isteyen_doktor_id=doktor.id,
            tetkik_turu=RadyolojiTetkikTuru.ROENTGEN,
            vucut_bolgesi="SEED göğüs PA",
            aciliyet=RadyolojiAciliyet.RUTIN,
            durum=RadyolojiIstemDurumu.ISTENDI,
        )
    )
    session.commit()
