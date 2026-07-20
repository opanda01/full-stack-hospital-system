from app.core.enums import Rol
from app.core.permissions import Kapsam, kapsam_getir


def test_mudur_nobet_olustur():
    assert kapsam_getir(Rol.MUDUR, "nobet:olustur") == Kapsam.GLOBAL


def test_doktor_nobet_goruntule_kendi():
    assert kapsam_getir(Rol.DOKTOR, "nobet:goruntule") == Kapsam.KENDI_KAYDIM
