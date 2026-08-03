"""Seed demo kullanıcılar.

Kullanım (backend venv aktifken):
  python -m app.core.seed_cli
"""

import app.core.models_registry  # noqa: F401
from app.core.db import engine
from app.core.seed_bashekim import seed_bashekim_demo
from app.core.seed_doktor import seed_doktor_panel
from app.core.seed_hastane import seed_hastane_referans
from app.core.seed_hemsire_yatis import seed_hemsire_yatis
from app.core.seed_ornek_islemler import seed_ornek_islemler
from app.core.seed_rbac import DEMO_SIFRE, seed_demo_kullanicilar
from app.core.seed_yatak_yonetimi import seed_yatak_yonetimi_demo
from app.core.seed_ameliyathane import seed_ameliyathane_demo
from app.core.seed_radyoloji import seed_radyoloji_demo
from sqlmodel import Session


def main() -> None:
    with Session(engine) as session:
        seed_demo_kullanicilar(session)
        seed_hastane_referans(session)
        seed_ornek_islemler(session)
        seed_bashekim_demo(session)
        seed_doktor_panel(session)
        seed_hemsire_yatis(session)
        seed_yatak_yonetimi_demo(session)
        seed_ameliyathane_demo(session)
        seed_radyoloji_demo(session)
    print(
        f"Demo kullanıcılar + hastane referans + örnek işlemler + bashekim/doktor/hemsire demo seed tamamlandı "
        f"(şifre: {DEMO_SIFRE})."
    )


if __name__ == "__main__":
    main()
