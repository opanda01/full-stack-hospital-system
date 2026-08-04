"""Yaş / reşit hesaplama."""

from datetime import date


def yas_hesapla(dogum: date | None, *, bugun: date | None = None) -> int | None:
    if dogum is None:
        return None
    today = bugun or date.today()
    return today.year - dogum.year - (
        (today.month, today.day) < (dogum.month, dogum.day)
    )


def resit_mi(
    dogum: date | None,
    *,
    bugun: date | None = None,
    esik: int = 18,
) -> bool | None:
    """None = doğum tarihi yok; True = reşit; False = reşit değil."""
    yas = yas_hesapla(dogum, bugun=bugun)
    if yas is None:
        return None
    return yas >= esik
