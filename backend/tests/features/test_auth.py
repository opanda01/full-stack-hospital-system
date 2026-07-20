"""Auth endpoint testleri."""

from app.core.enums import Rol
from app.core.security import create_access_token, hash_password
from app.features.kullanicilar.models import Kullanici


def _auth(user: Kullanici) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {create_access_token(str(user.id), {'rol': user.rol.value})}"
    }


def test_login_ok(client, session):
    user = Kullanici(
        tc_kimlik_no="90000000001",
        ad="Login",
        soyad="Test",
        email="login@example.com",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.ADMIN,
        aktif_mi=True,
    )
    session.add(user)
    session.commit()

    r = client.post(
        "/auth/login",
        json={"email": "login@example.com", "sifre": "Test1234!"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["rol"] == "ADMIN"
    assert data.get("refresh_token")


def test_login_wrong_password(client, session):
    user = Kullanici(
        tc_kimlik_no="90000000002",
        ad="Login",
        soyad="Bad",
        email="bad@example.com",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.HASTA,
        aktif_mi=True,
    )
    session.add(user)
    session.commit()

    r = client.post(
        "/auth/login",
        json={"email": "bad@example.com", "sifre": "yanlis"},
    )
    assert r.status_code == 401


def test_me_ok(client, session):
    user = Kullanici(
        tc_kimlik_no="90000000003",
        ad="Me",
        soyad="User",
        email="me@example.com",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.DOKTOR,
        aktif_mi=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    r = client.get("/auth/me", headers=_auth(user))
    assert r.status_code == 200
    assert r.json()["email"] == "me@example.com"
    assert r.json()["rol"] == "DOKTOR"


def test_kullanici_list_forbidden_for_hasta(client, session):
    user = Kullanici(
        tc_kimlik_no="90000000004",
        ad="Hasta",
        soyad="User",
        email="hasta-crud@example.com",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.HASTA,
        aktif_mi=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    r = client.get("/kullanicilar/", headers=_auth(user))
    assert r.status_code == 403


def test_kullanici_create_admin(client, session):
    admin = Kullanici(
        tc_kimlik_no="90000000005",
        ad="Admin",
        soyad="User",
        email="admin-crud@example.com",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.ADMIN,
        aktif_mi=True,
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)

    r = client.post(
        "/kullanicilar/",
        headers=_auth(admin),
        json={
            "tc_kimlik_no": "90000000006",
            "ad": "Yeni",
            "soyad": "Kullanici",
            "email": "yeni@example.com",
            "sifre": "Test1234!",
            "rol": "HEMSIRE",
        },
    )
    assert r.status_code == 201
    assert r.json()["rol"] == "HEMSIRE"
