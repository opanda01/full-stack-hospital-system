from app.core.enums import Rol
from app.core.permissions import kapsam_getir, Kapsam


def test_admin_kullanici_sil():
    assert kapsam_getir(Rol.ADMIN, "kullanici:sil") == Kapsam.GLOBAL
