"""Muayene feature testleri — kapsam doğrulaması backend/tests içinde."""

from app.core.enums import Rol
from app.core.permissions import Kapsam, kapsam_getir


def test_doktor_muayene_olustur_kendi():
    assert kapsam_getir(Rol.DOKTOR, "muayene:olustur") == Kapsam.KENDI_KAYDIM


def test_hasta_muayene_goruntule_kendi():
    assert kapsam_getir(Rol.HASTA, "muayene:goruntule") == Kapsam.KENDI_KAYDIM
