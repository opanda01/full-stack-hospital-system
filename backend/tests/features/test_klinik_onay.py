"""P0 — Klinik onay: oluştur, onay/red, müdür 403."""

from app.core.enums import Rol
from app.core.security import create_access_token, hash_password
from app.features.kullanicilar.models import Kullanici


def auth_header(user: Kullanici) -> dict[str, str]:
    token = create_access_token(user.id, user.rol)
    return {"Authorization": f"Bearer {token}"}


def _mudur(session) -> Kullanici:
    u = Kullanici(
        tc_kimlik_no="88888888881",
        ad="Test",
        soyad="Mudur",
        email="mudur-klinik@t.test",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.MUDUR,
        aktif_mi=True,
    )
    session.add(u)
    session.commit()
    session.refresh(u)
    return u


def test_doktor_klinik_onay_olustur(client, seeded):
    r = client.post(
        "/klinik-onay/",
        headers=auth_header(seeded["doktor_a"]),
        json={
            "tur": "RECETE",
            "hasta_id": seeded["hasta_a_entity"].id,
            "icerik": "Parasetamol 500mg 3x1",
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["tur"] == "RECETE"
    assert body["onay_durumu"] == "BEKLEMEDE"
    assert body["olusturan_id"] == seeded["doktor_a"].id


def test_bashekim_onayla_ve_reddet(client, seeded):
    r = client.post(
        "/klinik-onay/",
        headers=auth_header(seeded["doktor_a"]),
        json={
            "tur": "SEVK",
            "hasta_id": seeded["hasta_a_entity"].id,
            "icerik": "Ortopedi sevk",
        },
    )
    assert r.status_code == 201
    kayit_id = r.json()["id"]

    r = client.post(
        f"/klinik-onay/{kayit_id}/onayla",
        headers=auth_header(seeded["bashekim"]),
    )
    assert r.status_code == 200
    assert r.json()["onay_durumu"] == "ONAYLANDI"
    assert r.json()["onaylayan_id"] == seeded["bashekim"].id

    r = client.post(
        "/klinik-onay/",
        headers=auth_header(seeded["doktor_a"]),
        json={
            "tur": "TIBBI_RAPOR",
            "hasta_id": seeded["hasta_a_entity"].id,
            "icerik": "Rapor metni",
        },
    )
    red_id = r.json()["id"]
    r = client.post(
        f"/klinik-onay/{red_id}/reddet",
        headers=auth_header(seeded["bashekim"]),
    )
    assert r.status_code == 200
    assert r.json()["onay_durumu"] == "REDDEDILDI"


def test_mudur_klinik_onay_403(client, session, seeded):
    mudur = _mudur(session)
    r = client.get("/klinik-onay/", headers=auth_header(mudur))
    assert r.status_code == 403

    r = client.post(
        "/klinik-onay/",
        headers=auth_header(seeded["doktor_a"]),
        json={
            "tur": "RECETE",
            "hasta_id": seeded["hasta_a_entity"].id,
            "icerik": "Test",
        },
    )
    kayit_id = r.json()["id"]
    r = client.post(
        f"/klinik-onay/{kayit_id}/onayla",
        headers=auth_header(mudur),
    )
    assert r.status_code == 403
