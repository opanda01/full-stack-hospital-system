"""MHRS randevu eşlemesi (mock/sandbox stub)."""

from uuid import uuid4

from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.features.entegrasyonlar.outbox_models import EntegrasyonGonderim
from app.features.kullanicilar.models import Kullanici
from app.features.randevular.models import Randevu


def mhrs_randevu_olustur(
    session: Session,
    *,
    randevu: Randevu,
    actor: Kullanici,
    ip_adresi: str | None = None,
    commit: bool = True,
) -> Randevu:
    if randevu.mhrs_randevu_id:
        return randevu
    if randevu.durum == "IPTAL":
        raise HTTPException(status_code=400, detail="İptal randevu MHRS'ye gönderilemez")
    mhrs_id = f"MHRS-{uuid4().hex[:12].upper()}"
    randevu.mhrs_randevu_id = mhrs_id
    session.add(randevu)
    idem = f"mhrs:randevu:create:{randevu.id}"
    if not session.exec(
        select(EntegrasyonGonderim).where(EntegrasyonGonderim.idempotency_key == idem)
    ).first():
        session.add(
            EntegrasyonGonderim(
                sistem="MHRS",
                kaynak="randevu",
                kaynak_id=str(randevu.id),
                idempotency_key=idem,
                durum="GONDERILDI",
                dis_referans=mhrs_id,
            )
        )
    denetim_kaydi_yaz(
        session,
        aksiyon="MHRS_RANDEVU_OLUSTUR",
        actor_id=actor.id,
        kaynak="randevu",
        kaynak_id=randevu.id,
        detay={"mhrs_randevu_id": mhrs_id},
        ip_adresi=ip_adresi,
        commit=False,
    )
    if commit:
        session.commit()
        session.refresh(randevu)
    else:
        session.flush()
    return randevu


def mhrs_randevu_iptal(
    session: Session,
    *,
    randevu: Randevu,
    actor: Kullanici,
    ip_adresi: str | None = None,
    commit: bool = True,
) -> Randevu:
    if not randevu.mhrs_randevu_id:
        return randevu
    eski = randevu.mhrs_randevu_id
    idem = f"mhrs:randevu:cancel:{randevu.id}:{eski}"
    if not session.exec(
        select(EntegrasyonGonderim).where(EntegrasyonGonderim.idempotency_key == idem)
    ).first():
        session.add(
            EntegrasyonGonderim(
                sistem="MHRS",
                kaynak="randevu",
                kaynak_id=str(randevu.id),
                idempotency_key=idem,
                durum="GONDERILDI",
                dis_referans=eski,
            )
        )
    randevu.mhrs_randevu_id = None
    session.add(randevu)
    denetim_kaydi_yaz(
        session,
        aksiyon="MHRS_RANDEVU_IPTAL",
        actor_id=actor.id,
        kaynak="randevu",
        kaynak_id=randevu.id,
        detay={"mhrs_randevu_id": eski},
        ip_adresi=ip_adresi,
        commit=False,
    )
    if commit:
        session.commit()
        session.refresh(randevu)
    else:
        session.flush()
    return randevu
