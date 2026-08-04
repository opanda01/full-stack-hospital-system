"""Acil triyaj iş kuralları."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.enums import TriyajRenk
from app.core.public_id import hasta_from_public_id
from app.features.acil.models import AcilTriyajKaydi
from app.features.kullanicilar.models import Kullanici
from app.features.randevular.models import Randevu


def triyaj_kaydet(
    session: Session,
    *,
    actor: Kullanici,
    hasta_public_id: UUID,
    sikayet_ozet: str,
    renk: TriyajRenk,
    ats_skor: int | None = None,
    randevu_id: int | None = None,
    notlar: str | None = None,
    ip_adresi: str | None = None,
) -> AcilTriyajKaydi:
    hasta = hasta_from_public_id(session, hasta_public_id)
    assert hasta.id is not None
    if randevu_id is not None:
        randevu = session.get(Randevu, randevu_id)
        if randevu is None or randevu.hasta_id != hasta.id:
            raise HTTPException(status_code=400, detail="Randevu hasta ile eşleşmiyor")
    row = AcilTriyajKaydi(
        hasta_id=hasta.id,
        randevu_id=randevu_id,
        sikayet_ozet=sikayet_ozet.strip(),
        ats_skor=ats_skor,
        renk=renk,
        kaydeden_id=actor.id,  # type: ignore[arg-type]
        notlar=notlar,
    )
    session.add(row)
    session.flush()
    denetim_kaydi_yaz(
        session,
        aksiyon="ACIL_TRIYAJ",
        actor_id=actor.id,
        kaynak="acil_triyaj",
        kaynak_id=row.id,
        detay={"hasta_id": hasta.id, "renk": renk.value, "ats_skor": ats_skor},
        ip_adresi=ip_adresi,
        commit=False,
    )
    session.commit()
    session.refresh(row)
    return row


def list_triyaj(
    session: Session,
    *,
    hasta_public_id: UUID | None = None,
    limit: int = 50,
) -> list[AcilTriyajKaydi]:
    q = select(AcilTriyajKaydi).order_by(AcilTriyajKaydi.id.desc()).limit(limit)
    if hasta_public_id is not None:
        hasta = hasta_from_public_id(session, hasta_public_id)
        assert hasta.id is not None
        q = q.where(AcilTriyajKaydi.hasta_id == hasta.id)
    return list(session.exec(q).all())
