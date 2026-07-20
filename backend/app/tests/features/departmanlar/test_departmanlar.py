from app.core.enums import Rol
from app.core.permissions import Kapsam, kapsam_getir


def test_hasta_departman_goruntule():
    assert kapsam_getir(Rol.HASTA, "departman:goruntule") == Kapsam.GLOBAL


def test_doktor_departman_olustur_yok():
    assert kapsam_getir(Rol.DOKTOR, "departman:olustur") == Kapsam.YOK
