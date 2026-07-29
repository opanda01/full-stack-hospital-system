"""Unit tests for clinic slot rules."""

from datetime import date, datetime, timezone

from app.core.timezone import ISTANBUL
from app.features.randevular.clinic_slots import (
    iter_klinik_slotlari,
    klinik_saatleri_icinde_mi,
    oglen_arasi_mi,
)


def test_oglen_arasi_kapali():
    gun = date(2030, 6, 10)
    slots = iter_klinik_slotlari(gun)
    for s in slots:
        assert not oglen_arasi_mi(s)
        t = s.strftime("%H:%M")
        assert t not in ("12:00", "12:15", "12:30", "12:45")
    assert any(s.strftime("%H:%M") == "11:45" for s in slots)
    assert any(s.strftime("%H:%M") == "13:00" for s in slots)


def test_klinik_saatleri_icinde_mi():
    ok = datetime(2030, 6, 10, 10, 0, tzinfo=ISTANBUL)
    assert klinik_saatleri_icinde_mi(ok)
    lunch = datetime(2030, 6, 10, 12, 30, tzinfo=ISTANBUL)
    assert not klinik_saatleri_icinde_mi(lunch)
    early = datetime(2030, 6, 10, 8, 30, tzinfo=ISTANBUL)
    assert not klinik_saatleri_icinde_mi(early)
