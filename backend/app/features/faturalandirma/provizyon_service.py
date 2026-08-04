"""MEDULA provizyon — randevu / muayene öncesi iş akışı."""

from decimal import Decimal

from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.crypto import decrypt_phi
from app.features.entegrasyonlar.outbox_models import EntegrasyonGonderim
from app.features.faturalandirma.models import Fatura
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.randevular.models import Randevu
from app.integrations.factory import get_medula


def provizyon_al_randevu(
    session: Session,
    *,
    randevu: Randevu,
    actor: Kullanici,
    ip_adresi: str | None = None,
) -> Randevu:
    if randevu.medula_provizyon_no:
        return randevu
    hasta = session.get(Hasta, randevu.hasta_id)
    if hasta is None:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")
    tc = decrypt_phi(hasta.tc_kimlik_no) or hasta.tc_kimlik_no
    res = get_medula().provizyon_al(
        {
            "randevu_id": randevu.id,
            "hasta_id": randevu.hasta_id,
            "tc_kimlik_no": tc,
            "departman_id": randevu.departman_id,
            "doktor_id": randevu.doktor_id,
        }
    )
    if not res.basarili:
        raise HTTPException(
            status_code=502,
            detail=res.mesaj or "MEDULA provizyon alınamadı",
        )
    randevu.medula_provizyon_no = res.provizyon_no
    randevu.medula_takip_no = res.takip_no
    session.add(randevu)

    fatura = Fatura(
        hasta_id=randevu.hasta_id,
        tutar=Decimal("0"),
        durum="PROVIZYON",
        aciklama=f"Randevu {randevu.id} provizyon",
        provizyon_no=res.provizyon_no,
        medula_takip_no=res.takip_no,
        gonderim_durumu="BEKLEMEDE",
    )
    session.add(fatura)
    session.flush()

    idem = f"medula:provizyon:randevu:{randevu.id}"
    existing = session.exec(
        select(EntegrasyonGonderim).where(
            EntegrasyonGonderim.idempotency_key == idem
        )
    ).first()
    if existing is None:
        session.add(
            EntegrasyonGonderim(
                sistem="MEDULA",
                kaynak="randevu",
                kaynak_id=str(randevu.id),
                idempotency_key=idem,
                durum="GONDERILDI",
                dis_referans=res.provizyon_no,
            )
        )

    denetim_kaydi_yaz(
        session,
        aksiyon="MEDULA_PROVIZYON",
        actor_id=actor.id,
        kaynak="randevu",
        kaynak_id=randevu.id,
        detay={
            "provizyon_no": res.provizyon_no,
            "takip_no": res.takip_no,
            "fatura_id": fatura.id,
        },
        ip_adresi=ip_adresi,
        commit=False,
    )
    session.commit()
    session.refresh(randevu)
    return randevu
