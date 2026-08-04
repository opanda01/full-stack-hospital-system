"""Klinik olaylardan E-Nabız paket tetikleme."""

from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.crypto import decrypt_phi
from app.features.entegrasyonlar.outbox_models import EntegrasyonGonderim
from app.features.hastalar.models import Hasta
from app.features.muayeneler.models import MuayeneKaydi
from app.integrations.factory import get_enabiz


def muayene_paketi_gonder(
    session: Session,
    *,
    muayene: MuayeneKaydi,
    hasta_id: int,
    actor_id: int | None = None,
    ip_adresi: str | None = None,
    commit: bool = True,
) -> str | None:
    assert muayene.id is not None
    idem = f"enabiz:muayene:{muayene.id}"
    existing = session.exec(
        select(EntegrasyonGonderim).where(
            EntegrasyonGonderim.idempotency_key == idem
        )
    ).first()
    if existing is not None:
        return existing.dis_referans

    hasta = session.get(Hasta, hasta_id)
    tc = None
    if hasta is not None:
        tc = decrypt_phi(hasta.tc_kimlik_no) or hasta.tc_kimlik_no

    payload = {
        "olay": "MUAYENE",
        "muayene_id": muayene.id,
        "hasta_id": hasta_id,
        "tc_kimlik_no": tc,
        "kimlik_tipi": hasta.kimlik_tipi if hasta else "TC",
    }
    res = get_enabiz().paket_gonder(payload)
    if not res.basarili:
        return None

    session.add(
        EntegrasyonGonderim(
            sistem="ENABIZ",
            kaynak="muayene",
            kaynak_id=str(muayene.id),
            idempotency_key=idem,
            durum="GONDERILDI",
            dis_referans=res.paket_id,
        )
    )
    denetim_kaydi_yaz(
        session,
        aksiyon="ENABIZ_PAKET",
        actor_id=actor_id,
        kaynak="muayene",
        kaynak_id=muayene.id,
        detay={"paket_id": res.paket_id, "hasta_id": hasta_id},
        ip_adresi=ip_adresi,
        commit=False,
    )
    if commit:
        session.commit()
    return res.paket_id
