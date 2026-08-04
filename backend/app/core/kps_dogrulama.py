"""KPS doğrulama yardımcısı — kayıt path'lerinde opsiyonel zorunluluk."""

from __future__ import annotations

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.integrations.factory import get_kps


def kps_dogrula_gerekirse(tc_kimlik_no: str) -> None:
    """`KPS_DOGRULAMA_ZORUNLU=true` ise KPS (mock/live) doğrulaması yapar."""
    if not get_settings().KPS_DOGRULAMA_ZORUNLU:
        return
    sonuc = get_kps().dogrula(tc_kimlik_no)
    if not sonuc.dogrulandi:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "kod": "KPS_DOGRULAMA_BASARISIZ",
                "mesaj": sonuc.mesaj or "TC kimlik KPS doğrulamasından geçemedi",
            },
        )
