from app.core.enums import Rol
from app.core.permissions import rol_izin_kodlari


def test_admin_permissions_wildcard():
    assert rol_izin_kodlari(Rol.ADMIN) == ["*"]


def test_doktor_permissions_include_randevu():
    assert "randevu:goruntule" in rol_izin_kodlari(Rol.DOKTOR)
