from app.core.enums import Rol
from app.core.permissions import Kapsam, kapsam_getir


def test_doktor_randevu_goruntule():
    assert kapsam_getir(Rol.DOKTOR, "randevu:goruntule") == Kapsam.KENDI_KAYDIM


def test_hasta_randevu_olustur():
    assert kapsam_getir(Rol.HASTA, "randevu:olustur") == Kapsam.KENDI_KAYDIM
