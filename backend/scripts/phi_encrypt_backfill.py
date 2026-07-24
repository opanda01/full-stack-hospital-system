"""PHI encrypt backfill — batch, skip_hasta_audit, özet PHI_ENCRYPT_BACKFILL."""

from __future__ import annotations

import argparse

from sqlalchemy import text
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.crypto import encrypt_phi, hmac_tc, clear_crypto_caches
from app.core.db import engine
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici


def run_batch(batch_size: int = 500, start_after_id: int = 0) -> dict:
    clear_crypto_caches()
    with Session(engine) as session:
        bind = session.get_bind()
        if bind.dialect.name == "postgresql":
            session.connection().execute(
                text("SELECT set_config('app.skip_hasta_audit', '1', true)")
            )

        hastalar = list(
            session.exec(
                select(Hasta)
                .where(Hasta.id > start_after_id)
                .where(Hasta.tc_kimlik_no_hash.is_(None))  # type: ignore[union-attr]
                .order_by(Hasta.id)
                .limit(batch_size)
            ).all()
        )
        if not hastalar:
            return {"row_count": 0}

        ids = [h.id for h in hastalar if h.id is not None]
        for h in hastalar:
            plain_tc = h.tc_kimlik_no
            plain_adres = h.adres
            # Skip if already encrypted
            if plain_tc and plain_tc.startswith("v") and ":" in plain_tc:
                h.tc_kimlik_no_hash = hmac_tc(
                    # cannot hmac ciphertext; leave if hash missing — expect plaintext stage
                    plain_tc
                )
            else:
                h.tc_kimlik_no_hash = hmac_tc(plain_tc)
                h.tc_kimlik_no = encrypt_phi(plain_tc) or plain_tc
                if plain_adres:
                    h.adres = encrypt_phi(plain_adres)
            session.add(h)

            k = session.get(Kullanici, h.kullanici_id)
            if k and k.tc_kimlik_no and not (
                k.tc_kimlik_no.startswith("v") and ":" in k.tc_kimlik_no
            ):
                k.tc_kimlik_no = encrypt_phi(k.tc_kimlik_no) or k.tc_kimlik_no
                session.add(k)

        denetim_kaydi_yaz(
            session,
            aksiyon="PHI_ENCRYPT_BACKFILL",
            actor_id=None,
            kaynak="phi_backfill",
            kaynak_id=f"{ids[0]}-{ids[-1]}",
            detay={
                "batch_from_id": ids[0],
                "batch_to_id": ids[-1],
                "row_count": len(ids),
                "key_version": 1,
            },
            commit=False,
        )
        session.commit()
        return {
            "row_count": len(ids),
            "batch_from_id": ids[0],
            "batch_to_id": ids[-1],
        }


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--batch-size", type=int, default=500)
    p.add_argument("--start-after-id", type=int, default=0)
    args = p.parse_args()
    cursor = args.start_after_id
    total = 0
    while True:
        res = run_batch(args.batch_size, cursor)
        if not res["row_count"]:
            break
        total += res["row_count"]
        cursor = res["batch_to_id"]
        print(res)
    print({"total": total})


if __name__ == "__main__":
    main()
