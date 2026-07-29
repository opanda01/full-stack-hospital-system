"""Toplu test hasta kullanıcı seed (~100 kayıt, idempotent).

Kullanım (backend venv, DB erişimi):
  python -m app.core.seed_hasta_toplu
  python -m app.core.seed_hasta_toplu --count 100
"""

from __future__ import annotations

import argparse
from datetime import date

import app.core.models_registry  # noqa: F401
from sqlmodel import Session, select

from app.core.crypto import encrypt_phi, hmac_tc, phi_encrypt_enabled
from app.core.db import engine
from app.core.enums import ErisimDurumu, Rol
from app.core.security import hash_password
from app.core.seed_rbac import DEMO_SIFRE
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.personel.erisim_service import apply_erisim_durumu

ADLAR = (
    "Ayşe",
    "Mehmet",
    "Zeynep",
    "Ali",
    "Fatma",
    "Mustafa",
    "Elif",
    "Ahmet",
    "Hatice",
    "Emre",
    "Selin",
    "Burak",
    "Deniz",
    "Cem",
    "Merve",
    "Oğuz",
    "Esra",
    "Can",
    "Gül",
    "Kerem",
)

SOYADLAR = (
    "Yılmaz",
    "Demir",
    "Kaya",
    "Çelik",
    "Şahin",
    "Yıldız",
    "Aydın",
    "Öztürk",
    "Arslan",
    "Doğan",
    "Kılıç",
    "Aslan",
    "Çetin",
    "Kara",
    "Koç",
    "Kurt",
    "Özdemir",
    "Polat",
    "Erdoğan",
    "Aksoy",
)

KAN_GRUPLARI = ("A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-")


def _tc_for_index(i: int) -> str:
    """11 haneli benzersiz test TC (30100000001 …)."""
    return f"301{i:08d}"


def seed_test_hastalar(session: Session, *, count: int = 100) -> tuple[int, int]:
    """Yeni hasta+kullanıcı oluşturur. (oluşturulan, atlanan) döner."""
    if count < 1:
        return 0, 0

    sifre_hash = hash_password(DEMO_SIFRE)
    created = 0
    skipped = 0
    enc = phi_encrypt_enabled()

    for i in range(1, count + 1):
        tc = _tc_for_index(i)
        email = f"hasta.test{i:03d}@hastane.example.com"
        ad = ADLAR[(i - 1) % len(ADLAR)]
        soyad = SOYADLAR[(i - 1) % len(SOYADLAR)]
        cinsiyet = "K" if (i % 2) == 0 else "E"
        dogum_yili = 1955 + (i % 45)

        mevcut = session.exec(
            select(Kullanici).where(
                (Kullanici.email == email) | (Kullanici.tc_kimlik_no == tc)
            )
        ).first()
        if mevcut is None and enc:
            tc_hash_probe = hmac_tc(tc)
            mevcut = session.exec(
                select(Kullanici).where(Kullanici.tc_kimlik_no_hash == tc_hash_probe)
            ).first()
        if mevcut:
            skipped += 1
            continue

        kullanici = Kullanici(
            tc_kimlik_no=tc,
            ad=ad,
            soyad=soyad,
            email=email,
            telefon=f"0532{(1000000 + i):07d}"[:11],
            sifre_hash=sifre_hash,
            rol=Rol.HASTA,
            aktif_mi=True,
            sifre_degistirmeli_mi=False,
            kvkk_onaylandi_mi=True,
        )
        apply_erisim_durumu(kullanici, ErisimDurumu.ONAYLANDI)
        session.add(kullanici)
        session.flush()

        store_tc = tc
        tc_hash = hmac_tc(tc)
        if enc:
            store_tc = encrypt_phi(tc) or tc
            kullanici.tc_kimlik_no = store_tc
            kullanici.tc_kimlik_no_hash = tc_hash
            session.add(kullanici)

        session.add(
            Hasta(
                kullanici_id=kullanici.id,
                tc_kimlik_no=store_tc,
                tc_kimlik_no_hash=tc_hash if enc else None,
                dogum_tarihi=date(dogum_yili, (i % 12) + 1, min(28, (i % 27) + 1)),
                cinsiyet=cinsiyet,
                kan_grubu=KAN_GRUPLARI[i % len(KAN_GRUPLARI)],
                adres=f"Test Mah. No:{i} Çanakkale",
            )
        )
        created += 1

    session.commit()
    return created, skipped


def main() -> None:
    parser = argparse.ArgumentParser(description="Test hasta kullanıcıları seed")
    parser.add_argument("--count", type=int, default=100, help="Hedef kayıt sayısı")
    args = parser.parse_args()

    with Session(engine) as session:
        created, skipped = seed_test_hastalar(session, count=args.count)
    print(
        f"Test hasta seed tamamlandı: {created} yeni, {skipped} zaten vardı "
        f"(şifre: {DEMO_SIFRE})."
    )


if __name__ == "__main__":
    main()
