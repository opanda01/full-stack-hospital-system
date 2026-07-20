from app.core.enums import Rol
from app.core.permissions import Kapsam, kapsam_getir


def test_doktor_profil_duzenle_kendi():
    assert kapsam_getir(Rol.DOKTOR, "doktor:profil_duzenle") == Kapsam.KENDI_KAYDIM
