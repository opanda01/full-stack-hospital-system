from app.core.enums import Rol
from app.core.permissions import Kapsam, kapsam_getir


def test_laborant_sonuc_gir():
    assert kapsam_getir(Rol.LABORANT, "tetkik:sonuc_gir") == Kapsam.KENDI_KAYDIM


def test_hasta_tetkik_goruntule():
    assert kapsam_getir(Rol.HASTA, "tetkik:goruntule") == Kapsam.KENDI_KAYDIM
