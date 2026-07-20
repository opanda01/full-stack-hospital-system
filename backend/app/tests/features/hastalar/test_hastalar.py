from app.core.enums import Rol
from app.core.permissions import Kapsam, kapsam_getir


def test_hasta_randevu_iptal():
    assert kapsam_getir(Rol.HASTA, "randevu:iptal") == Kapsam.KENDI_KAYDIM
