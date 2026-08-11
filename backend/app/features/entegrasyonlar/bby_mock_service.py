"""Zorunlu bildirim (BBY mock) outbox tetikleme."""

from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.features.entegrasyonlar.outbox_models import EntegrasyonGonderim
from app.features.muayeneler.models import MuayeneKaydi


def zorunlu_bildirim_gonder(
    session: Session,
    *,
    muayene: MuayeneKaydi,
    actor_id: int | None = None,
    ip_adresi: str | None = None,
    commit: bool = True,
) -> str | None:
    assert muayene.id is not None
    idem = f"bby:muayene:{muayene.id}"
    existing = session.exec(
        select(EntegrasyonGonderim).where(
            EntegrasyonGonderim.idempotency_key == idem
        )
    ).first()
    if existing is not None:
        return existing.dis_referans

    turler: list[str] = []
    if muayene.bulasici_bildirim_mi:
        turler.append("BULASICI")
    if muayene.adli_vaka_mi:
        turler.append("ADLI")
    if muayene.olum_bildirim_mi:
        turler.append("OLUM")
    if not turler:
        return None

    ref = f"BBY-MOCK-{muayene.id}"
    session.add(
        EntegrasyonGonderim(
            sistem="BBY_MOCK",
            kaynak="muayene",
            kaynak_id=str(muayene.id),
            idempotency_key=idem,
            durum="GONDERILDI",
            dis_referans=ref,
            payload_json=",".join(turler),
        )
    )
    denetim_kaydi_yaz(
        session,
        aksiyon="ZORUNLU_BILDIRIM_GONDER",
        actor_id=actor_id,
        kaynak="muayene",
        kaynak_id=muayene.id,
        detay={"turler": turler, "dis_referans": ref},
        ip_adresi=ip_adresi,
        commit=False,
    )
    if commit:
        session.commit()
    return ref
