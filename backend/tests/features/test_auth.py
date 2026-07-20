"""Auth endpoint testleri."""

from app.core.enums import Rol
from app.core.security import create_access_token, hash_password
from app.features.kullanicilar.models import Kullanici


def _auth(user: Kullanici) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {create_access_token(user.id, user.rol)}"
    }


def _make_user(
    session,
    *,
    email: str,
    tc: str,
    rol: Rol = Rol.ADMIN,
    aktif_mi: bool = True,
    sifre: str = "Test1234!",
) -> Kullanici:
    user = Kullanici(
        tc_kimlik_no=tc,
        ad="Login",
        soyad="Test",
        email=email,
        sifre_hash=hash_password(sifre),
        rol=rol,
        aktif_mi=aktif_mi,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def test_login_ok(client, session):
    _make_user(session, email="login@example.com", tc="90000000001", rol=Rol.ADMIN)

    r = client.post(
        "/auth/login",
        json={"email": "login@example.com", "sifre": "Test1234!"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data.get("refresh_token")
    assert data["rol"] == "ADMIN"


def test_login_wrong_password(client, session):
    _make_user(session, email="bad@example.com", tc="90000000002", rol=Rol.HASTA)

    r = client.post(
        "/auth/login",
        json={"email": "bad@example.com", "sifre": "yanlis"},
    )
    assert r.status_code == 401


def test_login_passive_user_403(client, session):
    _make_user(
        session,
        email="pasif@example.com",
        tc="90000000007",
        rol=Rol.HASTA,
        aktif_mi=False,
    )

    r = client.post(
        "/auth/login",
        json={"email": "pasif@example.com", "sifre": "Test1234!"},
    )
    assert r.status_code == 403
    assert "pasif" in r.json()["detail"].lower()


def test_refresh_ok(client, session):
    _make_user(session, email="refresh@example.com", tc="90000000008", rol=Rol.DOKTOR)

    login = client.post(
        "/auth/login",
        json={"email": "refresh@example.com", "sifre": "Test1234!"},
    )
    assert login.status_code == 200
    old_refresh = login.json()["refresh_token"]

    r = client.post("/auth/refresh", json={"refresh_token": old_refresh})
    assert r.status_code == 200
    assert r.json()["access_token"]
    assert r.json()["refresh_token"]
    # Rotate: eski refresh artık geçersiz
    r2 = client.post("/auth/refresh", json={"refresh_token": old_refresh})
    assert r2.status_code == 401


def test_refresh_revoked_401(client, session):
    _make_user(session, email="revoked@example.com", tc="90000000009", rol=Rol.ADMIN)

    login = client.post(
        "/auth/login",
        json={"email": "revoked@example.com", "sifre": "Test1234!"},
    )
    refresh_token = login.json()["refresh_token"]
    access = login.json()["access_token"]

    logout = client.post(
        "/auth/logout",
        json={"refresh_token": refresh_token},
        headers={"Authorization": f"Bearer {access}"},
    )
    assert logout.status_code == 204

    r = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 401


def test_me_without_token_401(client):
    r = client.get("/auth/me")
    assert r.status_code == 401


def test_me_ok(client, session):
    user = _make_user(
        session, email="me@example.com", tc="90000000003", rol=Rol.DOKTOR
    )

    r = client.get("/auth/me", headers=_auth(user))
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "me@example.com"
    assert body["rol"] == "DOKTOR"
    assert body["ad"] == "Login"
    assert body["aktif_mi"] is True


def test_sifre_degistir_revokes_refresh(client, session):
    user = _make_user(
        session, email="sifre@example.com", tc="90000000010", rol=Rol.ADMIN
    )
    login = client.post(
        "/auth/login",
        json={"email": "sifre@example.com", "sifre": "Test1234!"},
    )
    refresh_token = login.json()["refresh_token"]

    r = client.post(
        "/auth/sifre-degistir",
        headers=_auth(user),
        json={"eski_sifre": "Test1234!", "yeni_sifre": "YeniSifre1!"},
    )
    assert r.status_code == 204

    r2 = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert r2.status_code == 401


def test_kullanici_list_forbidden_for_hasta(client, session):
    user = _make_user(
        session, email="hasta-crud@example.com", tc="90000000004", rol=Rol.HASTA
    )

    r = client.get("/kullanicilar/", headers=_auth(user))
    assert r.status_code == 403


def test_kullanici_create_admin(client, session):
    admin = _make_user(
        session, email="admin-crud@example.com", tc="90000000005", rol=Rol.ADMIN
    )

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


def test_kullanici_patch_rol_and_durum(client, session):
    admin = _make_user(
        session, email="admin-rol@example.com", tc="90000000011", rol=Rol.ADMIN
    )
    target = _make_user(
        session, email="target@example.com", tc="90000000012", rol=Rol.HASTA
    )

    r = client.patch(
        f"/kullanicilar/{target.id}/rol",
        headers=_auth(admin),
        json={"rol": "DOKTOR"},
    )
    assert r.status_code == 200
    assert r.json()["rol"] == "DOKTOR"

    r2 = client.patch(
        f"/kullanicilar/{target.id}/durum",
        headers=_auth(admin),
        json={"aktif_mi": False},
    )
    assert r2.status_code == 200
    assert r2.json()["aktif_mi"] is False
