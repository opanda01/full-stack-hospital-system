"""Seed demo kullanıcılar.

Kullanım (backend venv aktifken):
  python -m app.core.seed_cli
"""

import app.core.models_registry  # noqa: F401
from app.core.db import engine
from app.core.seed_demo_veri import seed_demo_veri
from app.core.seed_personel_toplu import seed_test_personel
from app.core.seed_rbac import DEMO_SIFRE
from sqlmodel import Session


def main() -> None:
    with Session(engine) as session:
        seed_test_personel(session, per_rol=50)
        seed_demo_veri(session, hasta_count=150, randevu_per_doktor=15)
    print(
        f"Demo kullanıcılar + hastane referans + örnek işlemler + bashekim/doktor/hemsire demo "
        f"+ toplu personel (rol başına 50) + demo veri seed tamamlandı (şifre: {DEMO_SIFRE})."
    )


if __name__ == "__main__":
    main()
