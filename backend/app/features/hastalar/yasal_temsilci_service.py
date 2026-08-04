"""Yasal temsilci (veli/vasi) CRUD ve onam kapısı."""

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.yas import resit_mi
from app.features.hastalar.models import Hasta
from app.features.hastalar.yasal_temsilci_models import HastaYasalTemsilci
from app.features.kullanicilar.models import Kullanici


def yasal_temsilci_gerekli_mi(hasta: Hasta) -> bool:
    if bool(getattr(hasta, "ehliyet_kisitli_mi", False)):
        return True
    return resit_mi(hasta.dogum_tarihi) is False


def list_yasal_temsilciler(
    session: Session, hasta_id: int, *, sadece_aktif: bool = True
) -> list[HastaYasalTemsilci]:
    q = select(HastaYasalTemsilci).where(HastaYasalTemsilci.hasta_id == hasta_id)
    if sadece_aktif:
        q = q.where(HastaYasalTemsilci.aktif_mi == True)  # noqa: E712
    return list(session.exec(q.order_by(HastaYasalTemsilci.id.desc())).all())


def create_yasal_temsilci(
    session: Session,
    *,
    hasta: Hasta,
    actor: Kullanici,
    tur: str,
    ad_soyad: str,
    tc_kimlik_no: str | None = None,
    telefon: str | None = None,
    yakinlik: str | None = None,
    ip_adresi: str | None = None,
) -> HastaYasalTemsilci:
    assert hasta.id is not None
    row = HastaYasalTemsilci(
        hasta_id=hasta.id,
        tur=tur,
        ad_soyad=ad_soyad.strip(),
        tc_kimlik_no=tc_kimlik_no,
        telefon=telefon,
        yakinlik=yakinlik,
        aktif_mi=True,
    )
    session.add(row)
    session.flush()
    denetim_kaydi_yaz(
        session,
        aksiyon="YASAL_TEMSILCI_EKLE",
        actor_id=actor.id,
        kaynak="hasta_yasal_temsilci",
        kaynak_id=row.id,
        detay={"hasta_id": hasta.id, "tur": tur},
        ip_adresi=ip_adresi,
        commit=False,
    )
    session.commit()
    session.refresh(row)
    return row


def cozumle_temsilci_onam(
    session: Session,
    *,
    hasta: Hasta,
    yasal_temsilci_id: int | None,
    temsilci_ad_soyad: str | None,
    temsilci_tc_kimlik_no: str | None,
    temsilci_tur: str | None,
) -> tuple[int | None, str | None, str | None, str | None]:
    """Onam için temsilci bilgisini doğrula / zenginleştir."""
    if not yasal_temsilci_gerekli_mi(hasta):
        return None, None, None, None

    if yasal_temsilci_id is not None:
        row = session.get(HastaYasalTemsilci, yasal_temsilci_id)
        if row is None or row.hasta_id != hasta.id or not row.aktif_mi:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz yasal temsilci kaydı",
            )
        return row.id, row.ad_soyad, row.tc_kimlik_no, row.tur

    ad = (temsilci_ad_soyad or "").strip()
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "18 yaş altı veya ehliyeti kısıtlı hasta için "
                "yasal temsilci (veli/vasi) onamı zorunludur"
            ),
        )
    tur = temsilci_tur or "VELI"
    if tur not in ("VELI", "VASI", "YASAL_TEMSILCI"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="temsilci_tur VELI, VASI veya YASAL_TEMSILCI olmalıdır",
        )
    return None, ad, temsilci_tc_kimlik_no, tur
