"""Toplu test personel seed (rol başına N kayıt, idempotent).

Kullanım (backend venv, DB erişimi):
  python -m app.core.seed_personel_toplu
  python -m app.core.seed_personel_toplu --per-rol 50
"""

from __future__ import annotations

import argparse

import app.core.models_registry  # noqa: F401
from sqlmodel import Session, select

from app.core.crypto import encrypt_phi, hmac_tc, phi_encrypt_enabled
from app.core.db import engine
from app.core.enums import ErisimDurumu, Rol
from app.core.security import hash_password
from app.core.seed_hasta_toplu import ADLAR, SOYADLAR
from app.core.seed_rbac import DEMO_SIFRE
from app.features.departmanlar.models import Departman
from app.features.doktorlar.models import Doktor
from app.features.kullanicilar.models import Kullanici
from app.features.personel.erisim_service import apply_erisim_durumu
from app.features.personel.models import Personel

# HASTA dışı operasyonel roller (demo admin/başhekim seed_rbac'de)
SEED_ROLLER: tuple[tuple[Rol, str, str], ...] = (
    (Rol.HEMSIRE, "HEM", "hemsire"),
    (Rol.EBE, "EBE", "ebe"),
    (Rol.TEMIZLIK_PERSONELI, "TEM", "temizlik"),
    (Rol.LABORANT, "LAB", "laborant"),
    (Rol.GUVENLIK, "GUV", "guvenlik"),
    (Rol.IDARI_PERSONEL, "IDR", "idari"),
    (Rol.DOKTOR, "DOK", "doktor"),
)


def _tc_for(rol_kod: int, index: int) -> str:
    """320RRNNNNNN — RR rol kodu (01–07), N sıra."""
    return f"320{rol_kod:02d}{index:06d}"


def _find_kullanici(session: Session, *, email: str, tc: str) -> Kullanici | None:
    enc = phi_encrypt_enabled()
    mevcut = session.exec(
        select(Kullanici).where(
            (Kullanici.email == email) | (Kullanici.tc_kimlik_no == tc)
        )
    ).first()
    if mevcut is None and enc:
        mevcut = session.exec(
            select(Kullanici).where(Kullanici.tc_kimlik_no_hash == hmac_tc(tc))
        ).first()
    return mevcut


def seed_test_personel(
    session: Session, *, per_rol: int = 50
) -> dict[str, tuple[int, int]]:
    if per_rol < 1:
        return {}

    departmanlar = list(session.exec(select(Departman).order_by(Departman.id)).all())
    dep_ids = [d.id for d in departmanlar if d.id is not None]

    sifre_hash = hash_password(DEMO_SIFRE)
    enc = phi_encrypt_enabled()
    ozet: dict[str, tuple[int, int]] = {}

    for rol_idx, (rol, sicil_prefix, mail_slug) in enumerate(SEED_ROLLER, start=1):
        created = 0
        skipped = 0

        for i in range(1, per_rol + 1):
            tc = _tc_for(rol_idx, i)
            email = f"{mail_slug}.test{i:03d}@hastane.example.com"
            sicil = f"{sicil_prefix}-TEST-{i:03d}"
            ad = ADLAR[(i - 1) % len(ADLAR)]
            soyad = SOYADLAR[(i + rol_idx) % len(SOYADLAR)]

            if session.exec(select(Personel).where(Personel.sicil_no == sicil)).first():
                skipped += 1
                continue

            if _find_kullanici(session, email=email, tc=tc):
                skipped += 1
                continue

            departman_id = dep_ids[(i - 1) % len(dep_ids)] if dep_ids else None

            kullanici = Kullanici(
                tc_kimlik_no=tc,
                ad=ad,
                soyad=soyad,
                email=email,
                telefon=f"0533{(rol_idx * 100000 + i):07d}"[:11],
                sifre_hash=sifre_hash,
                rol=rol,
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

            personel = Personel(
                kullanici_id=kullanici.id,
                sicil_no=sicil,
                departman_id=departman_id,
                unvan=rol.value,
            )
            session.add(personel)
            session.flush()

            if rol == Rol.DOKTOR:
                session.add(
                    Doktor(
                        personel_id=personel.id,
                        uzmanlik_alani="Genel" if i % 3 else "Dahiliye",
                        diploma_no=f"DIP-TEST-{rol_idx:02d}-{i:04d}",
                        online_randevu_acik_mi=True,
                    )
                )

            created += 1

        ozet[rol.value] = (created, skipped)

    session.commit()
    return ozet


def main() -> None:
    parser = argparse.ArgumentParser(description="Test personel kullanıcıları seed")
    parser.add_argument(
        "--per-rol",
        type=int,
        default=50,
        help="Her rol için hedef kayıt sayısı (varsayılan 50)",
    )
    args = parser.parse_args()

    with Session(engine) as session:
        ozet = seed_test_personel(session, per_rol=args.per_rol)

    print(f"Test personel seed tamamlandı (şifre: {DEMO_SIFRE}).")
    for rol, (c, s) in ozet.items():
        print(f"  {rol}: {c} yeni, {s} atlandı")


if __name__ == "__main__":
    main()
