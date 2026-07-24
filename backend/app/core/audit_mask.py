"""Audit detayına yazılmadan önce PII maskeleme (sabit kurallar)."""

from __future__ import annotations

from typing import Any


# Audit JSON'a asla tam yazılmayan / maskelenen alanlar
PII_MASK_FIELDS = frozenset({"tc_kimlik_no", "adres", "telefon", "sifre", "sifre_hash", "otp", "token"})
# Klinik diff'te tam tutulabilir
CLINICAL_DIFF_FIELDS = frozenset({"kan_grubu", "cinsiyet", "dogum_tarihi", "id", "kullanici_id"})
# Daraltılmış diff (p95 fallback)
NARROW_DIFF_FIELDS = frozenset({"kan_grubu", "cinsiyet", "dogum_tarihi"})


def mask_tc(tc: str | None) -> str:
    if not tc or len(tc) < 4:
        return "[masked]"
    return f"***{tc[-4:]}"


def mask_telefon(tel: str | None) -> str:
    if not tel or len(tel) < 4:
        return "[masked]"
    return f"***{tel[-4:]}"


def mask_value(key: str, value: Any) -> Any:
    if key in ("sifre", "sifre_hash", "otp", "token", "password"):
        return None  # hiç yazma
    if key == "tc_kimlik_no":
        return mask_tc(str(value) if value is not None else None)
    if key == "adres":
        return "[masked]"
    if key == "telefon":
        return mask_telefon(str(value) if value is not None else None)
    return value


def mask_dict(data: dict[str, Any] | None, *, narrow: bool = False) -> dict[str, Any]:
    if not data:
        return {}
    out: dict[str, Any] = {}
    for k, v in data.items():
        if k in ("sifre", "sifre_hash", "otp", "token", "password"):
            continue
        if narrow and k not in NARROW_DIFF_FIELDS and k not in ("id",):
            continue
        out[k] = mask_value(k, v)
    return out
