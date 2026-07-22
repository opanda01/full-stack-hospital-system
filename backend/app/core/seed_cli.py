"""Seed demo kullanıcılar.

Kullanım (backend venv aktifken):
  python -m app.core.seed_cli
"""

import app.core.models_registry  # noqa: F401
from app.core.db import engine
from app.core.seed_bashekim import seed_bashekim_demo
from app.core.seed_doktor import seed_doktor_panel
from app.core.seed_hastane import seed_hastane_referans
from app.core.seed_ornek_islemler import seed_ornek_islemler
from app.core.seed_rbac import DEMO_SIFRE, seed_demo_kullanicilar
from sqlmodel import Session


def main() -> None:
    with Session(engine) as session:
        seed_demo_kullanicilar(session)
        seed_hastane_referans(session)
        seed_ornek_islemler(session)
        seed_bashekim_demo(session)
        seed_doktor_panel(session)
    print(
        f"Demo kullanıcılar + hastane referans + örnek işlemler + bashekim/doktor demo seed tamamlandı "
        f"(şifre: {DEMO_SIFRE})."
    )


if __name__ == "__main__":
    main()
