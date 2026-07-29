"""Test doktorları ve seed hastalar için toplu randevu oluşturur (idempotent).

Kullanım:
  python -m app.core.seed_randevu_toplu
  python -m app.core.seed_randevu_toplu --per-doktor 12
"""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone

import app.core.models_registry  # noqa: F401
from sqlalchemy import or_
from sqlmodel import Session, select

from app.core.db import engine
from app.core.timezone import ISTANBUL, as_utc
from app.features.randevular.clinic_slots import klinik_saatleri_icinde_mi, SLOT_MINUTES
from app.features.doktorlar.models import Doktor
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.randevular.models import Randevu

NOTLAR_PREFIX = "SEED-RANDEVU-TOPLU"


def _test_doktorlar(session: Session) -> list[Doktor]:
    stmt = (
        select(Doktor)
        .join(Personel, Doktor.personel_id == Personel.id)
        .join(Kullanici, Personel.kullanici_id == Kullanici.id)
        .where(
            or_(
                Kullanici.email.like("doktor.test%"),
                Kullanici.email == "doktor@hastane.example.com",
                Kullanici.email.like("doktor.%@hastane.example.com"),
                Personel.sicil_no.like("DOK-TEST-%"),
            )
        )
        .order_by(Doktor.id.asc())
    )
    return list(session.exec(stmt).all())


def _seed_hastalar(session: Session, limit: int = 200) -> list[Hasta]:
    stmt = (
        select(Hasta)
        .join(Kullanici, Kullanici.id == Hasta.kullanici_id)
        .where(
            or_(
                Kullanici.email.like("hasta.test%"),
                Kullanici.email.like("hasta.%@hastane.example.com"),
                Hasta.tc_kimlik_no.like("301%"),
                Hasta.tc_kimlik_no.like("300%"),
            )
        )
        .order_by(Hasta.id.asc())
        .limit(limit)
    )
    return list(session.exec(stmt).all())


def _departman_for_doktor(session: Session, doktor: Doktor) -> int | None:
    personel = session.get(Personel, doktor.personel_id)
    if personel and personel.departman_id:
        return personel.departman_id
    return None


def _cakisma_var(session: Session, doktor_id: int, tarih_saat) -> bool:
    ts = as_utc(tarih_saat)
    bas = ts - timedelta(minutes=SLOT_MINUTES - 1)
    bit = ts + timedelta(minutes=SLOT_MINUTES - 1)
    row = session.exec(
        select(Randevu).where(
            Randevu.doktor_id == doktor_id,
            Randevu.durum != "IPTAL",
            Randevu.tarih_saat >= bas,
            Randevu.tarih_saat <= bit,
        )
    ).first()
    return row is not None


def seed_randevular_toplu(
    session: Session,
    *,
    per_doktor: int = 10,
    gun_sayisi: int = 14,
) -> tuple[int, int]:
    doktorlar = _test_doktorlar(session)
    hastalar = _seed_hastalar(session)
    if not doktorlar:
        return 0, 0
    if not hastalar:
        return 0, 0

    created = 0
    skipped = 0
    now_ist = datetime.now(ISTANBUL)
    base_day = (now_ist + timedelta(days=1)).replace(
        hour=9, minute=0, second=0, microsecond=0
    )

    hasta_idx = 0
    for doktor in doktorlar:
        dep_id = _departman_for_doktor(session, doktor)
        if dep_id is None:
            skipped += per_doktor
            continue

        slot_in_day = 0
        for n in range(per_doktor):
            etiket = f"{NOTLAR_PREFIX}-{doktor.id}-{n:03d}"
            if session.exec(select(Randevu).where(Randevu.notlar == etiket)).first():
                skipped += 1
                continue

            gun_offset = n % gun_sayisi
            day_start = base_day + timedelta(days=gun_offset)
            hour = 9 + (slot_in_day * SLOT_MINUTES) // 60
            minute = (slot_in_day * SLOT_MINUTES) % 60
            if hour >= 17:
                slot_in_day = 0
                hour = 9
                minute = 0
                gun_offset = (gun_offset + 1) % gun_sayisi
                day_start = base_day + timedelta(days=gun_offset)

            tarih_saat = day_start.replace(hour=hour, minute=minute)
            while not klinik_saatleri_icinde_mi(as_utc(tarih_saat)):
                tarih_saat = tarih_saat + timedelta(minutes=SLOT_MINUTES)
                if tarih_saat.hour >= 17:
                    slot_in_day = 0
                    gun_offset = (gun_offset + 1) % gun_sayisi
                    day_start = base_day + timedelta(days=gun_offset)
                    tarih_saat = day_start.replace(hour=9, minute=0)
            if _cakisma_var(session, doktor.id, tarih_saat):
                tarih_saat = tarih_saat + timedelta(minutes=SLOT_MINUTES)
            while not klinik_saatleri_icinde_mi(as_utc(tarih_saat)):
                tarih_saat = tarih_saat + timedelta(minutes=SLOT_MINUTES)
                if tarih_saat.hour >= 17:
                    break
            if _cakisma_var(session, doktor.id, tarih_saat):
                skipped += 1
                continue

            hasta = hastalar[hasta_idx % len(hastalar)]
            hasta_idx += 1

            session.add(
                Randevu(
                    hasta_id=hasta.id,
                    doktor_id=doktor.id,
                    departman_id=dep_id,
                    tarih_saat=as_utc(tarih_saat),
                    durum="BEKLEMEDE",
                    notlar=etiket,
                )
            )
            created += 1
            slot_in_day += 1

    session.commit()
    return created, skipped


def main() -> None:
    parser = argparse.ArgumentParser(description="Test randevuları seed")
    parser.add_argument(
        "--per-doktor",
        type=int,
        default=10,
        help="Her test doktoru için randevu sayısı (varsayılan 10)",
    )
    parser.add_argument(
        "--gun",
        type=int,
        default=14,
        dest="gun_sayisi",
        help="Randevuların dağıtılacağı gün sayısı",
    )
    args = parser.parse_args()

    with Session(engine) as session:
        doktor_say = len(_test_doktorlar(session))
        hasta_say = len(_seed_hastalar(session))
        created, skipped = seed_randevular_toplu(
            session,
            per_doktor=max(1, args.per_doktor),
            gun_sayisi=max(1, args.gun_sayisi),
        )

    print(
        f"Randevu seed: {created} yeni, {skipped} atlandı "
        f"({doktor_say} test doktoru, {hasta_say} hasta adayı)."
    )


if __name__ == "__main__":
    main()
