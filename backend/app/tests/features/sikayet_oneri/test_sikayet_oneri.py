from app.core.enums import Rol
from app.core.permissions import Kapsam, kapsam_getir


def test_hasta_sikayet_gonder():
    assert kapsam_getir(Rol.HASTA, "sikayet_oneri:gonder") == Kapsam.GLOBAL


def test_hasta_tumunu_goruntule_yok():
    assert kapsam_getir(Rol.HASTA, "sikayet_oneri:tumunu_goruntule") == Kapsam.YOK
