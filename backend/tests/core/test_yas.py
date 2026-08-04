"""Yaş / reşit yardımcıları."""

from datetime import date

from app.core.yas import resit_mi, yas_hesapla


def test_yas_ve_resit():
    bugun = date(2026, 8, 4)
    assert yas_hesapla(date(2008, 8, 4), bugun=bugun) == 18
    assert resit_mi(date(2008, 8, 4), bugun=bugun) is True
    assert resit_mi(date(2008, 8, 5), bugun=bugun) is False
    assert resit_mi(None) is None
