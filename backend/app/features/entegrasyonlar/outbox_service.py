"""Entegrasyon outbox listeleme ve yeniden deneme."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.base_model import utc_now
from app.features.entegrasyonlar.outbox_models import EntegrasyonGonderim
from app.integrations.factory import get_enabiz, get_medula


def list_outbox(
    session: Session,
    *,
    durum: str | None = None,
    limit: int = 100,
) -> list[EntegrasyonGonderim]:
    q = select(EntegrasyonGonderim).order_by(EntegrasyonGonderim.id.desc()).limit(limit)
    if durum:
        q = q.where(EntegrasyonGonderim.durum == durum)
    return list(session.exec(q).all())


def retry_gonderim(session: Session, gonderim_id: int) -> EntegrasyonGonderim:
    row = session.get(EntegrasyonGonderim, gonderim_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Outbox kaydı bulunamadı")

    row.deneme += 1
    row.son_deneme = utc_now()
    basarili = False
    hata: str | None = None

    try:
        payload = json.loads(row.payload_json) if row.payload_json else {}
        if row.sistem == "ENABIZ":
            res = get_enabiz().paket_gonder(payload or {"kaynak": row.kaynak})
            basarili = res.basarili
            if basarili:
                row.dis_referans = res.paket_id
            else:
                hata = res.mesaj
        elif row.sistem in ("MEDULA", "SGK_PROVIZYON"):
            res = get_medula().provizyon_al(payload or {"kaynak_id": row.kaynak_id})
            basarili = res.basarili
            if basarili:
                row.dis_referans = res.provizyon_no
            else:
                hata = res.mesaj
        else:
            hata = f"Yeniden deneme desteklenmiyor: {row.sistem}"
    except NotImplementedError as exc:
        hata = str(exc)
    except Exception as exc:  # noqa: BLE001
        hata = str(exc)

    if basarili:
        row.durum = "GONDERILDI"
        row.son_hata = None
    else:
        row.durum = "HATA"
        row.son_hata = (hata or "Bilinmeyen hata")[:1000]

    session.add(row)
    session.commit()
    session.refresh(row)
    return row
