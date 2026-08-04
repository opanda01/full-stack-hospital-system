"""Ameliyat özel onam — KVKK metni + e-imza metadata."""

from datetime import datetime

from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.base_model import utc_now
from app.core.enums import KvkkMetinTur
from app.features.ameliyathane.models import AmeliyatPlani
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.kvkk.models import KvkkMetni, KvkkOnayKaydi


def kaydet_ameliyat_onam(
    session: Session,
    *,
    plan: AmeliyatPlani,
    actor: Kullanici,
    e_imza_referans: str | None = None,
    ip: str | None = None,
) -> AmeliyatPlani:
    if plan.onam_alindi_mi:
        return plan
    metin = session.exec(
        select(KvkkMetni).where(
            KvkkMetni.tur == KvkkMetinTur.AMELIYAT_ONAM,
            KvkkMetni.aktif_mi == True,  # noqa: E712
        )
    ).first()
    if metin is None:
        raise HTTPException(
            status_code=400,
            detail="Aktif ameliyat onam metni bulunamadı (KVKK AMELIYAT_ONAM)",
        )
    hasta = session.get(Hasta, plan.hasta_id)
    if hasta is None:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")

    onay = KvkkOnayKaydi(
        kullanici_id=hasta.kullanici_id,
        metin_id=metin.id,
        onay_tarihi=utc_now(),
        ip=ip,
    )
    session.add(onay)
    session.flush()

    plan.onam_alindi_mi = True
    plan.onam_zamani = datetime.utcnow()
    plan.onam_kvkk_onay_id = onay.id
    plan.e_imza_referans = e_imza_referans
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return plan
