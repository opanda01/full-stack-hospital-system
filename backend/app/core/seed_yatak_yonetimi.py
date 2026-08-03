"""Yatak yönetimi demo: 2 servis × 3 oda × 2 yatak (idempotent)."""

from sqlmodel import Session, select

from app.core.enums import ServisTipi, YatakDurumu
from app.features.yatak_yonetimi.models import Oda, Servis, Yatak


def seed_yatak_yonetimi_demo(session: Session) -> None:
    if session.exec(select(Servis).where(Servis.kod == "YY-DEMO-1")).first():
        return

    s1 = Servis(
        ad="YY Demo Dahiliye",
        kod="YY-DEMO-1",
        tip=ServisTipi.DAHILIYE,
        kat_no=4,
    )
    s2 = Servis(
        ad="YY Demo Cerrahi",
        kod="YY-DEMO-2",
        tip=ServisTipi.CERRAHI,
        kat_no=5,
    )
    session.add(s1)
    session.add(s2)
    session.flush()

    for servis, prefix in ((s1, "D"), (s2, "C")):
        for oda_i in range(1, 4):
            oda = Oda(servis_id=servis.id, oda_no=f"{prefix}{oda_i}01")
            session.add(oda)
            session.flush()
            for bed in ("A", "B"):
                session.add(
                    Yatak(
                        oda_id=oda.id,
                        yatak_no=bed,
                        durum=YatakDurumu.BOS,
                    )
                )

    session.commit()
