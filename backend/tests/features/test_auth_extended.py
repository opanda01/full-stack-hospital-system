"""Auth genişletme: sicil login, onboarding, OTP, çift profil, IP."""

from datetime import datetime, timedelta, timezone

from sqlmodel import select

from app.core.enums import OtpAmac, OturumTipi, Rol
from app.core.request_ip import istemci_ip_al
from app.core.security import create_access_token, hash_password, hash_token
from app.features.auth.models import DenetimKaydi, OtpKodu
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel


def _auth(user: Kullanici, *, oturum_tipi: OturumTipi = OturumTipi.PERSONEL) -> dict:
    return {
        "Authorization": (
            f"Bearer {create_access_token(user.id, user.rol, oturum_tipi=oturum_tipi)}"
        )
    }


def _make_user(session, **kwargs) -> Kullanici:
    if "tc" in kwargs:
        kwargs["tc_kimlik_no"] = kwargs.pop("tc")
    defaults = dict(
        ad="Test",
        soyad="User",
        sifre_hash=hash_password("Test1234!"),
        aktif_mi=True,
        sifre_degistirmeli_mi=False,
        kvkk_onaylandi_mi=True,
    )
    defaults.update(kwargs)
    user = Kullanici(**defaults)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def test_login_sicil_ok(client, session):
    user = _make_user(
        session,
        email="hemsire@example.com",
        tc="91000000001",
        rol=Rol.HEMSIRE,
        kullanici_adi="h.ayse",
    )
    session.add(Personel(kullanici_id=user.id, sicil_no="H-100"))
    session.commit()

    r = client.post(
        "/auth/login",
        json={"kimlik": "H-100", "sifre": "Test1234!"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["oturum_tipi"] == "personel"
    assert data["rol"] == "HEMSIRE"
    assert "sifre_degistirmeli_mi" in data

    audit = session.exec(
        select(DenetimKaydi).where(DenetimKaydi.aksiyon == "LOGIN_BASARILI")
    ).first()
    assert audit is not None


def test_onboarding_allowlist(client, session):
    user = _make_user(
        session,
        email="yeni@example.com",
        tc="91000000002",
        rol=Rol.HEMSIRE,
        sifre_degistirmeli_mi=True,
        kvkk_onaylandi_mi=False,
    )
    session.add(Personel(kullanici_id=user.id, sicil_no="H-101"))
    session.commit()

    headers = _auth(user)
    assert client.get("/auth/me", headers=headers).status_code == 200
    blocked = client.get("/departmanlar/", headers=headers)
    assert blocked.status_code == 403
    assert "KVKK" in blocked.json()["detail"] or "şifre" in blocked.json()["detail"].lower()

    r = client.post(
        "/auth/sifre-degistir",
        headers=headers,
        json={"eski_sifre": "Test1234!", "yeni_sifre": "YeniSifre1!"},
    )
    assert r.status_code == 204

    session.refresh(user)
    assert user.sifre_degistirmeli_mi is False

    r2 = client.post(
        "/auth/kvkk-onay",
        headers=_auth(user),
        json={"onay": True},
    )
    assert r2.status_code == 200
    assert r2.json()["kvkk_onaylandi_mi"] is True
    assert client.get("/departmanlar/", headers=_auth(user)).status_code == 200


def test_otp_kayit_ve_giris(client, session, monkeypatch):
    monkeypatch.setattr(
        "app.features.auth.service.secrets.choice",
        lambda seq: "1",
    )

    gonder = client.post(
        "/auth/otp/gonder",
        json={
            "telefon": "05551112233",
            "tc_kimlik_no": "91000000003",
            "amac": "KAYIT",
        },
    )
    assert gonder.status_code == 200

    dogrula = client.post(
        "/auth/otp/dogrula",
        json={
            "telefon": "05551112233",
            "tc_kimlik_no": "91000000003",
            "kod": "111111",
            "amac": "KAYIT",
            "ad": "Ali",
            "soyad": "Veli",
            "kvkk_onay": True,
        },
    )
    assert dogrula.status_code == 200
    body = dogrula.json()
    assert body["oturum_tipi"] == "hasta"
    assert body["rol"] == "HASTA"

    # Giriş OTP — rate limit aynı telefonu engellemesin diye doğrudan kayıt
    now = datetime.now(timezone.utc)
    session.add(
        OtpKodu(
            telefon="05551112233",
            tc_kimlik_no="91000000003",
            kod_hash=hash_token("111111"),
            amac=OtpAmac.GIRIS,
            deneme_sayisi=0,
            son_kullanma=now + timedelta(minutes=5),
            kullanildi_mi=False,
            created_at=now - timedelta(minutes=2),
        )
    )
    session.commit()
    d2 = client.post(
        "/auth/otp/dogrula",
        json={
            "telefon": "05551112233",
            "tc_kimlik_no": "91000000003",
            "kod": "111111",
            "amac": "GIRIS",
        },
    )
    assert d2.status_code == 200


def test_otp_rate_limit(client, session, monkeypatch):
    monkeypatch.setattr(
        "app.features.auth.service.secrets.choice",
        lambda seq: "2",
    )
    payload = {
        "telefon": "05552223344",
        "tc_kimlik_no": "91000000004",
        "amac": "KAYIT",
    }
    assert client.post("/auth/otp/gonder", json=payload).status_code == 200
    r2 = client.post("/auth/otp/gonder", json=payload)
    assert r2.status_code == 429


def test_otp_max_deneme(client, session):
    now = datetime.now(timezone.utc)
    session.add(
        OtpKodu(
            telefon="05553334455",
            tc_kimlik_no="91000000005",
            kod_hash=hash_token("999999"),
            amac=OtpAmac.KAYIT,
            deneme_sayisi=0,
            son_kullanma=now + timedelta(minutes=5),
            kullanildi_mi=False,
            created_at=now,
        )
    )
    session.commit()

    for _ in range(5):
        client.post(
            "/auth/otp/dogrula",
            json={
                "telefon": "05553334455",
                "tc_kimlik_no": "91000000005",
                "kod": "000000",
                "amac": "KAYIT",
                "ad": "X",
                "soyad": "Y",
                "kvkk_onay": True,
            },
        )
    r = client.post(
        "/auth/otp/dogrula",
        json={
            "telefon": "05553334455",
            "tc_kimlik_no": "91000000005",
            "kod": "000000",
            "amac": "KAYIT",
            "ad": "X",
            "soyad": "Y",
            "kvkk_onay": True,
        },
    )
    assert r.status_code == 400
    assert "limit" in r.json()["detail"].lower() or "deneme" in r.json()["detail"].lower()


def test_cift_profil_personel_sonra_otp_hasta(client, session, monkeypatch):
    monkeypatch.setattr(
        "app.features.auth.service.secrets.choice",
        lambda seq: "3",
    )
    user = _make_user(
        session,
        email="cift@example.com",
        tc="91000000006",
        rol=Rol.HEMSIRE,
        telefon="05554445566",
    )
    session.add(Personel(kullanici_id=user.id, sicil_no="H-200"))
    session.commit()

    client.post(
        "/auth/otp/gonder",
        json={
            "telefon": "05554445566",
            "tc_kimlik_no": "91000000006",
            "amac": "KAYIT",
        },
    )
    r = client.post(
        "/auth/otp/dogrula",
        json={
            "telefon": "05554445566",
            "tc_kimlik_no": "91000000006",
            "kod": "333333",
            "amac": "KAYIT",
            "kvkk_onay": True,
        },
    )
    assert r.status_code == 200
    assert r.json()["oturum_tipi"] == "hasta"
    # Stored rol demote edilmez
    session.refresh(user)
    assert user.rol == Rol.HEMSIRE
    hasta = session.exec(select(Hasta).where(Hasta.kullanici_id == user.id)).first()
    assert hasta is not None

    # Personel token → personel izinleri; hasta token → hasta
    assert (
        client.get("/personel/", headers=_auth(user, oturum_tipi=OturumTipi.PERSONEL)).status_code
        == 403
    )  # HEMSIRE personel:listele yok
    # Hasta oturumu departman görüntüleyebilir
    assert (
        client.get(
            "/departmanlar/", headers=_auth(user, oturum_tipi=OturumTipi.HASTA)
        ).status_code
        == 200
    )
    # Personel oturumu da (HEMSIRE) departman görebilir
    assert (
        client.get(
            "/departmanlar/", headers=_auth(user, oturum_tipi=OturumTipi.PERSONEL)
        ).status_code
        == 200
    )


def test_deprecated_register_headers(client, session):
    r = client.post(
        "/auth/register",
        json={
            "tc_kimlik_no": "91000000007",
            "ad": "Eski",
            "soyad": "Kayit",
            "email": "eski@example.com",
            "sifre": "Test1234!",
        },
    )
    assert r.status_code == 201
    assert r.headers.get("X-Deprecated") == "true"
    assert r.headers.get("Sunset")
    assert "uyari" in r.json()


def test_istemci_ip_trusted_proxy(monkeypatch):
    from app.core.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("TRUSTED_PROXY_IPS", "10.0.0.1")
    get_settings.cache_clear()

    class FakeClient:
        host = "10.0.0.1"

    class FakeRequest:
        client = FakeClient()
        headers = {"x-forwarded-for": "203.0.113.9, 10.0.0.1"}

    assert istemci_ip_al(FakeRequest()) == "203.0.113.9"  # type: ignore[arg-type]

    class Untrusted:
        client = type("C", (), {"host": "203.0.113.1"})()
        headers = {"x-forwarded-for": "1.2.3.4"}

    assert istemci_ip_al(Untrusted()) == "203.0.113.1"  # type: ignore[arg-type]
    get_settings.cache_clear()


def test_sifre_sifirla_unknown_kimlik_no_otp(client, session):
    r = client.post(
        "/auth/sifre-sifirla/istek",
        json={"kimlik": "yok-sicil-999"},
    )
    assert r.status_code == 200
    assert r.json()["son_kullanma_saniye"] > 0
    otps = session.exec(
        select(OtpKodu).where(OtpKodu.amac == OtpAmac.SIFRE_SIFIRLAMA)
    ).all()
    assert len(otps) == 0


def test_sifre_sifirla_ok_and_login(client, session, monkeypatch):
    monkeypatch.setattr(
        "app.features.auth.service.secrets.choice",
        lambda seq: "4",
    )
    user = _make_user(
        session,
        email="reset@example.com",
        tc="91000000008",
        rol=Rol.HEMSIRE,
    )
    session.add(Personel(kullanici_id=user.id, sicil_no="H-300"))
    session.commit()

    istek = client.post(
        "/auth/sifre-sifirla/istek",
        json={"kimlik": "H-300"},
    )
    assert istek.status_code == 200
    otp = session.exec(
        select(OtpKodu).where(
            OtpKodu.amac == OtpAmac.SIFRE_SIFIRLAMA,
            OtpKodu.tc_kimlik_no == "91000000008",
        )
    ).first()
    assert otp is not None

    wrong = client.post(
        "/auth/sifre-sifirla/onay",
        json={
            "kimlik": "H-300",
            "kod": "000000",
            "yeni_sifre": "YeniSifre9!",
        },
    )
    assert wrong.status_code == 400

    ok = client.post(
        "/auth/sifre-sifirla/onay",
        json={
            "kimlik": "H-300",
            "kod": "444444",
            "yeni_sifre": "YeniSifre9!",
        },
    )
    assert ok.status_code == 204

    old = client.post(
        "/auth/login",
        json={"kimlik": "H-300", "sifre": "Test1234!"},
    )
    assert old.status_code == 401

    new = client.post(
        "/auth/login",
        json={"kimlik": "H-300", "sifre": "YeniSifre9!"},
    )
    assert new.status_code == 200


def test_sifre_sifirla_rate_limit(client, session, monkeypatch):
    monkeypatch.setattr(
        "app.features.auth.service.secrets.choice",
        lambda seq: "5",
    )
    user = _make_user(
        session,
        email="rate-reset@example.com",
        tc="91000000009",
        rol=Rol.ADMIN,
        telefon="05556667788",
    )
    session.add(Personel(kullanici_id=user.id, sicil_no="A-300"))
    session.commit()

    payload = {"kimlik": "rate-reset@example.com"}
    assert client.post("/auth/sifre-sifirla/istek", json=payload).status_code == 200
    r2 = client.post("/auth/sifre-sifirla/istek", json=payload)
    assert r2.status_code == 429
