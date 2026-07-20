from app.core.enums import Rol
from app.core.permissions import Kapsam, kapsam_getir


def test_temizlik_guncelle_kendi():
    assert kapsam_getir(Rol.TEMIZLIK_PERSONELI, "temizlik_gorevi:guncelle") == Kapsam.KENDI_KAYDIM


def test_mudur_temizlik_ata():
    assert kapsam_getir(Rol.MUDUR, "temizlik_gorevi:ata") == Kapsam.GLOBAL
