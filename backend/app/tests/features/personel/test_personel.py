from app.core.enums import Rol
from app.core.permissions import Kapsam, kapsam_getir


def test_mudur_personel_listele():
    assert kapsam_getir(Rol.MUDUR, "personel:listele") == Kapsam.GLOBAL
