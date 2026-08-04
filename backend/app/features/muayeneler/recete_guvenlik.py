"""Reçete alerji / ilaç etkileşim kontrolü."""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.enums import AlerjiSiddet, AllerjenTipi, IlacEtkilesimSeviye
from app.features.hastalar.alerji_models import HastaAlerjisi
from app.features.muayeneler.recete_models import (
    IlacEtkenMaddesi,
    IlacEtkilesimi,
)


HARD_STOP_SIDDETLER = frozenset({AlerjiSiddet.SIDDETLI, AlerjiSiddet.ANAFILAKSI})


@dataclass
class GuvenlikUyari:
    kod: str
    seviye: str  # HARD_STOP | UYARI
    mesaj: str


@dataclass
class ReceteKalemGirdi:
    urun_adi: str
    barkod: str | None = None
    ilac_id: int | None = None


def _normalize(s: str | None) -> str:
    return (s or "").strip().casefold()


def _etkenler_for_kalem(
    session: Session, kalem: ReceteKalemGirdi
) -> list[IlacEtkenMaddesi]:
    q = select(IlacEtkenMaddesi)
    rows = list(session.exec(q).all())
    out: list[IlacEtkenMaddesi] = []
    ad = _normalize(kalem.urun_adi)
    barkod = _normalize(kalem.barkod)
    for r in rows:
        if kalem.ilac_id is not None and r.ilac_id == kalem.ilac_id:
            out.append(r)
            continue
        if barkod and r.etken_kodu and _normalize(r.etken_kodu) == barkod:
            out.append(r)
            continue
        if ad and r.urun_adi_eslesme and _normalize(r.urun_adi_eslesme) in ad:
            out.append(r)
            continue
        if ad and _normalize(r.etken_adi) in ad:
            out.append(r)
    return out


def kontrol_et(
    session: Session,
    *,
    hasta_id: int,
    kalemler: list[ReceteKalemGirdi],
) -> list[GuvenlikUyari]:
    if not kalemler:
        return []

    alerjiler = list(
        session.exec(
            select(HastaAlerjisi).where(
                HastaAlerjisi.hasta_id == hasta_id,
                HastaAlerjisi.silindi_mi == False,  # noqa: E712
            )
        ).all()
    )
    etkilesimler = list(session.exec(select(IlacEtkilesimi)).all())
    uyarilar: list[GuvenlikUyari] = []

    kalem_etkenleri: list[tuple[ReceteKalemGirdi, list[IlacEtkenMaddesi]]] = [
        (k, _etkenler_for_kalem(session, k)) for k in kalemler
    ]

    for kalem, etkenler in kalem_etkenleri:
        ad = _normalize(kalem.urun_adi)
        barkod = _normalize(kalem.barkod)
        etken_kodlari = {_normalize(e.etken_kodu) for e in etkenler}
        etken_adlari = {_normalize(e.etken_adi) for e in etkenler}

        for al in alerjiler:
            eslesme = False
            if al.allerjen_tipi == AllerjenTipi.ILAC:
                if al.allerjen_kodu and barkod and _normalize(al.allerjen_kodu) == barkod:
                    eslesme = True
                elif _normalize(al.allerjen_adi) and _normalize(al.allerjen_adi) in ad:
                    eslesme = True
            elif al.allerjen_tipi == AllerjenTipi.ETKEN_MADDE:
                kod = _normalize(al.allerjen_kodu)
                if kod and kod in etken_kodlari:
                    eslesme = True
                elif _normalize(al.allerjen_adi) in etken_adlari:
                    eslesme = True
                elif _normalize(al.allerjen_adi) in ad:
                    eslesme = True
            else:
                if _normalize(al.allerjen_adi) and _normalize(al.allerjen_adi) in ad:
                    eslesme = True

            if not eslesme:
                continue
            kod = f"ALERJI_{al.siddet.value}_{al.id}"
            if al.siddet in HARD_STOP_SIDDETLER:
                uyarilar.append(
                    GuvenlikUyari(
                        kod=kod,
                        seviye="HARD_STOP",
                        mesaj=(
                            f"Alerji hard-stop: {al.allerjen_adi} "
                            f"({al.siddet.value}) — {kalem.urun_adi}"
                        ),
                    )
                )
            else:
                uyarilar.append(
                    GuvenlikUyari(
                        kod=kod,
                        seviye="UYARI",
                        mesaj=(
                            f"Alerji uyarısı: {al.allerjen_adi} "
                            f"({al.siddet.value}) — {kalem.urun_adi}"
                        ),
                    )
                )

    # Aynı reçete içi DDI
    tum_etken: list[str] = []
    for _, etkenler in kalem_etkenleri:
        for e in etkenler:
            tum_etken.append(_normalize(e.etken_kodu) or _normalize(e.etken_adi))

    for i, a in enumerate(tum_etken):
        for b in tum_etken[i + 1 :]:
            if not a or not b or a == b:
                continue
            for etk in etkilesimler:
                ea, eb = _normalize(etk.etken_a), _normalize(etk.etken_b)
                pair = {ea, eb} == {a, b}
                if not pair:
                    continue
                seviye = etk.seviye
                if seviye == IlacEtkilesimSeviye.KONTRANDIKE.value:
                    uyarilar.append(
                        GuvenlikUyari(
                            kod=f"DDI_KONTRANDIKE_{etk.id}",
                            seviye="HARD_STOP",
                            mesaj=f"Kontrendike etkileşim: {etk.aciklama}",
                        )
                    )
                else:
                    uyarilar.append(
                        GuvenlikUyari(
                            kod=f"DDI_UYARI_{etk.id}",
                            seviye="UYARI",
                            mesaj=f"İlaç etkileşim uyarısı: {etk.aciklama}",
                        )
                    )

    return uyarilar


def uygula_veya_engelle(
    session: Session,
    *,
    hasta_id: int,
    kalemler: list[ReceteKalemGirdi],
    uyari_kodlari: list[str] | None,
    gerekce: str | None,
    baglam: str = "RECETE",
) -> list[GuvenlikUyari]:
    """Hard-stop → 422; uyarılar gerekçe + kod listesi olmadan → 422.

    baglam: RECETE | MAR — hata kodu öneki.
    """
    uyarilar = kontrol_et(session, hasta_id=hasta_id, kalemler=kalemler)
    hard = [u for u in uyarilar if u.seviye == "HARD_STOP"]
    soft = [u for u in uyarilar if u.seviye == "UYARI"]
    prefix = baglam if baglam in {"RECETE", "MAR"} else "RECETE"

    if hard:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "kod": f"{prefix}_HARD_STOP",
                "mesaj": (
                    "İlaç uygulama engellendi (break-glass yok)"
                    if prefix == "MAR"
                    else "Reçete engellendi (break-glass yok)"
                ),
                "uyarilar": [{"kod": u.kod, "mesaj": u.mesaj} for u in hard],
            },
        )

    if soft:
        onaylanan = set(uyari_kodlari or [])
        gereken = {u.kod for u in soft}
        if not gereken.issubset(onaylanan):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "kod": f"{prefix}_UYARI_ONAY_GEREKLI",
                    "mesaj": "Uyarılar için gerekçe ve onay zorunlu",
                    "uyarilar": [{"kod": u.kod, "mesaj": u.mesaj} for u in soft],
                },
            )
        if not gerekce or len(gerekce.strip()) < 10:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "kod": f"{prefix}_UYARI_GEREKCE",
                    "mesaj": "Override gerekçesi en az 10 karakter olmalı",
                    "uyarilar": [{"kod": u.kod, "mesaj": u.mesaj} for u in soft],
                },
            )

    return soft
