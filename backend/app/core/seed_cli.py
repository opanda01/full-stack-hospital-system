"""Seed demo kullanıcılar.

Kullanım (backend venv aktifken):
  python -m app.core.seed_cli
"""

import app.core.models_registry  # noqa: F401
from app.core.db import engine
from app.core.seed_hastane import seed_hastane_referans
from app.core.seed_rbac import DEMO_SIFRE, seed_demo_kullanicilar
from sqlmodel import Session


def main() -> None:
    with Session(engine) as session:
        seed_demo_kullanicilar(session)
        seed_hastane_referans(session)
    print(
        f"Demo kullanıcılar + hastane referans seed tamamlandı (şifre: {DEMO_SIFRE})."
    )


if __name__ == "__main__":
    main()
