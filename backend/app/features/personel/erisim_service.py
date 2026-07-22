"""Personel erişim durumu — tek yazım noktası (aktif_mi türetilir)."""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.enums import ErisimDurumu, PersonelKaynakTipi, Rol
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def apply_erisim_durumu(
    kullanici: Kullanici,
    durum: ErisimDurumu,
    *,
    onaylayan_id: int | None = None,
    red_gerekce: str | None = None,
) -> None:
    """Tek kaynak geçiş — aktif_mi buradan türetilir."""
    kullanici.erisim_durumu = durum
    if durum == ErisimDurumu.ONAYLANDI:
        kullanici.aktif_mi = True
        kullanici.erisim_red_gerekce = None
        kullanici.erisim_onaylayan_id = onaylayan_id
        kullanici.erisim_onay_tarihi = _utc_now()
    else:
        kullanici.aktif_mi = False
        if durum == ErisimDurumu.REDDEDILDI:
            kullanici.erisim_red_gerekce = red_gerekce
            kullanici.erisim_onaylayan_id = onaylayan_id
            kullanici.erisim_onay_tarihi = _utc_now()
        elif durum == ErisimDurumu.BEKLEMEDE:
            kullanici.erisim_red_gerekce = None
            kullanici.erisim_onaylayan_id = None
            kullanici.erisim_onay_tarihi = None


def list_erisim_talepleri(
    session: Session, *, durum: ErisimDurumu | None = None
) -> list[dict]:
    stmt = (
        select(Personel, Kullanici)
        .join(Kullanici, Personel.kullanici_id == Kullanici.id)
        .where(Kullanici.rol != Rol.HASTA)
        .order_by(Personel.id.desc())
    )
    if durum is not None:
        stmt = stmt.where(Kullanici.erisim_durumu == durum)
    rows = session.exec(stmt).all()
    out: list[dict] = []
    for personel, kullanici in rows:
        out.append(
            {
                "personel_id": personel.id,
                "kullanici_id": kullanici.id,
                "sicil_no": personel.sicil_no,
                "ad": kullanici.ad,
                "soyad": kullanici.soyad,
                "email": kullanici.email,
                "rol": kullanici.rol.value
                if isinstance(kullanici.rol, Rol)
                else str(kullanici.rol),
                "erisim_durumu": kullanici.erisim_durumu.value
                if isinstance(kullanici.erisim_durumu, ErisimDurumu)
                else str(kullanici.erisim_durumu),
                "aktif_mi": kullanici.aktif_mi,
                "kaynak_tipi": kullanici.erisim_kaynak_tipi.value
                if isinstance(kullanici.erisim_kaynak_tipi, PersonelKaynakTipi)
                else str(kullanici.erisim_kaynak_tipi),
                "firma_adi": kullanici.erisim_firma_adi,
                "red_gerekce": kullanici.erisim_red_gerekce,
                "onaylayan_id": kullanici.erisim_onaylayan_id,
                "onay_tarihi": kullanici.erisim_onay_tarihi,
            }
        )
    return out


def _get_personel_kullanici(
    session: Session, personel_id: int
) -> tuple[Personel, Kullanici]:
    personel = session.get(Personel, personel_id)
    if personel is None:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    kullanici = session.get(Kullanici, personel.kullanici_id)
    if kullanici is None:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return personel, kullanici


def _onay_sonrasi_onboarding(kullanici: Kullanici) -> None:
    kullanici.sifre_degistirmeli_mi = True
    kullanici.kvkk_onaylandi_mi = False


def onayla_erisim_kayit(
    session: Session,
    personel_id: int,
    *,
    actor: Kullanici,
    ip_adresi: str | None = None,
) -> dict:
    personel, kullanici = _get_personel_kullanici(session, personel_id)
    if kullanici.erisim_durumu == ErisimDurumu.ONAYLANDI:
        raise HTTPException(status_code=400, detail="Zaten onaylı")
    apply_erisim_durumu(
        kullanici, ErisimDurumu.ONAYLANDI, onaylayan_id=actor.id
    )
    _onay_sonrasi_onboarding(kullanici)
    session.add(kullanici)
    denetim_kaydi_yaz(
        session,
        aksiyon="PERSONEL_ERISIM_ONAY",
        actor_id=actor.id,
        kaynak="personel",
        kaynak_id=personel.id,
        ip_adresi=ip_adresi,
        detay={"kullanici_id": kullanici.id},
        commit=False,
    )
    session.commit()
    try:
        from app.features.bashekim.router import invalidate_bashekim_ozet

        invalidate_bashekim_ozet()
    except Exception:
        pass
    return _talep_dict(personel, kullanici)


def reddet_erisim(
    session: Session,
    personel_id: int,
    *,
    actor: Kullanici,
    gerekce: str,
    ip_adresi: str | None = None,
) -> dict:
    if not (gerekce or "").strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Red gerekçesi zorunludur",
        )
    personel, kullanici = _get_personel_kullanici(session, personel_id)
    apply_erisim_durumu(
        kullanici,
        ErisimDurumu.REDDEDILDI,
        onaylayan_id=actor.id,
        red_gerekce=gerekce.strip(),
    )
    session.add(kullanici)
    denetim_kaydi_yaz(
        session,
        aksiyon="PERSONEL_ERISIM_RED",
        actor_id=actor.id,
        kaynak="personel",
        kaynak_id=personel.id,
        ip_adresi=ip_adresi,
        detay={"gerekce": gerekce.strip()},
        commit=False,
    )
    session.commit()
    try:
        from app.features.bashekim.router import invalidate_bashekim_ozet

        invalidate_bashekim_ozet()
    except Exception:
        pass
    return _talep_dict(personel, kullanici)


def bypass_onayla(
    session: Session,
    personel_id: int,
    *,
    actor: Kullanici,
    gerekce: str,
    ip_adresi: str | None = None,
) -> dict:
    rol_val = actor.rol.value if isinstance(actor.rol, Rol) else str(actor.rol)
    if rol_val != Rol.ADMIN.value:
        raise HTTPException(status_code=403, detail="Yalnızca ADMIN bypass yapabilir")
    if not (gerekce or "").strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Bypass gerekçesi zorunludur",
        )
    personel, kullanici = _get_personel_kullanici(session, personel_id)
    apply_erisim_durumu(
        kullanici, ErisimDurumu.ONAYLANDI, onaylayan_id=actor.id
    )
    _onay_sonrasi_onboarding(kullanici)
    session.add(kullanici)
    denetim_kaydi_yaz(
        session,
        aksiyon="PERSONEL_ERISIM_ONAY_BYPASS",
        actor_id=actor.id,
        kaynak="personel",
        kaynak_id=personel.id,
        ip_adresi=ip_adresi,
        detay={"gerekce": gerekce.strip(), "kullanici_id": kullanici.id},
        commit=False,
    )
    session.commit()
    try:
        from app.features.bashekim.router import invalidate_bashekim_ozet

        invalidate_bashekim_ozet()
    except Exception:
        pass
    return _talep_dict(personel, kullanici)


def _talep_dict(personel: Personel, kullanici: Kullanici) -> dict:
    return {
        "personel_id": personel.id,
        "kullanici_id": kullanici.id,
        "sicil_no": personel.sicil_no,
        "ad": kullanici.ad,
        "soyad": kullanici.soyad,
        "email": kullanici.email,
        "rol": kullanici.rol.value
        if isinstance(kullanici.rol, Rol)
        else str(kullanici.rol),
        "erisim_durumu": kullanici.erisim_durumu.value
        if isinstance(kullanici.erisim_durumu, ErisimDurumu)
        else str(kullanici.erisim_durumu),
        "aktif_mi": kullanici.aktif_mi,
        "kaynak_tipi": kullanici.erisim_kaynak_tipi.value
        if isinstance(kullanici.erisim_kaynak_tipi, PersonelKaynakTipi)
        else str(kullanici.erisim_kaynak_tipi),
        "firma_adi": kullanici.erisim_firma_adi,
        "red_gerekce": kullanici.erisim_red_gerekce,
        "onaylayan_id": kullanici.erisim_onaylayan_id,
        "onay_tarihi": kullanici.erisim_onay_tarihi,
    }


def set_durum_via_erisim(
    session: Session, kullanici_id: int, aktif_mi: bool
) -> Kullanici:
    """Admin durum toggle — erisim_durumu üzerinden."""
    kullanici = session.get(Kullanici, kullanici_id)
    if kullanici is None:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    if aktif_mi:
        apply_erisim_durumu(kullanici, ErisimDurumu.ONAYLANDI)
    else:
        apply_erisim_durumu(kullanici, ErisimDurumu.REDDEDILDI, red_gerekce="Admin pasif")
    session.add(kullanici)
    session.commit()
    session.refresh(kullanici)
    return kullanici
