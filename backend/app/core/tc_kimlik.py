"""T.C. kimlik numarası algoritmik doğrulama."""

from __future__ import annotations

from typing import Annotated

from pydantic import BeforeValidator, Field

TC_GECERSIZ_MESAJ = "Geçersiz TC kimlik numarası"


def gecerli_tc_kimlik_no(tc: str) -> bool:
    if not tc or len(tc) != 11 or not tc.isdigit():
        return False
    if tc[0] == "0":
        return False
    digits = [int(c) for c in tc]
    odd_sum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8]
    even_sum = digits[1] + digits[3] + digits[5] + digits[7]
    d10 = (odd_sum * 7 - even_sum) % 10
    if digits[9] != d10:
        return False
    d11 = sum(digits[:10]) % 10
    return digits[10] == d11


def tc_ilk_dokuz_haneden(first9: str) -> str:
    """İlk 9 haneden geçerli 11 haneli TC üretir (test/seed yardımcısı)."""
    first9 = first9.strip()
    if len(first9) != 9 or not first9.isdigit() or first9[0] == "0":
        raise ValueError("Geçersiz 9 haneli TC öneki")
    digits = [int(c) for c in first9]
    odd_sum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8]
    even_sum = digits[1] + digits[3] + digits[5] + digits[7]
    d10 = (odd_sum * 7 - even_sum) % 10
    d11 = (sum(digits) + d10) % 10
    return first9 + str(d10) + str(d11)


def _tc_kimlik_no_validate(value: str) -> str:
    v = value.strip()
    if not gecerli_tc_kimlik_no(v):
        raise ValueError(TC_GECERSIZ_MESAJ)
    return v


def tc_kimlik_dogrula_veya_none(value: str | None) -> str | None:
    if value is None:
        return None
    v = value.strip()
    if not v:
        return None
    if not gecerli_tc_kimlik_no(v):
        raise ValueError(TC_GECERSIZ_MESAJ)
    return v


TcKimlikNo = Annotated[
    str,
    Field(min_length=11, max_length=11),
    BeforeValidator(_tc_kimlik_no_validate),
]

TcKimlikNoOpsiyonel = Annotated[
    str | None,
    BeforeValidator(tc_kimlik_dogrula_veya_none),
]
