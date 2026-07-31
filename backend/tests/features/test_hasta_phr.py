"""Hasta PHR: onaylı klinik belge, özet, şikâyet benim."""

from app.core.enums import Rol
from app.core.security import create_access_token
from app.core.enums import OturumTipi


def _hasta_auth(user) -> dict[str, str]:
    token = create_access_token(
        user.id, user.rol, oturum_tipi=OturumTipi.HASTA
    )
    return {"Authorization": f"Bearer {token}"}


def test_hasta_onayli_klinik_belge_goruntule(client, seeded):
    r = client.post(
        "/klinik-onay/",
        headers={
            "Authorization": f"Bearer {create_access_token(seeded['doktor_a'].id, seeded['doktor_a'].rol)}"
        },
        json={
            "tur": "RECETE",
            "hasta_id": str(seeded["hasta_a_entity"].public_id),
            "icerik": "Mobil hasta test reçetesi",
        },
    )
    assert r.status_code == 201
    kayit_id = r.json()["id"]
    r = client.post(
        f"/klinik-onay/{kayit_id}/onayla",
        headers={
            "Authorization": f"Bearer {create_access_token(seeded['bashekim'].id, seeded['bashekim'].rol)}"
        },
    )
    assert r.status_code == 200

    r = client.get("/klinik-onay/", headers=_hasta_auth(seeded["hasta_a"]))
    assert r.status_code == 200
    items = r.json()["items"]
    assert any(i["id"] == kayit_id and i["tur"] == "RECETE" for i in items)

    r = client.get("/hastalar/ben/belgeler", headers=_hasta_auth(seeded["hasta_a"]))
    assert r.status_code == 200
    belgeler = r.json()["items"]
    assert any(
        b["kaynak"] == "KLINIK_ONAY" and b["id"] == kayit_id for b in belgeler
    )


def test_hasta_ozet_endpoint(client, seeded):
    r = client.get("/hastalar/ben/ozet", headers=_hasta_auth(seeded["hasta_a"]))
    assert r.status_code == 200
    body = r.json()
    assert "ad_soyad" in body
    assert "okunmamis_sonuc_sayisi" in body


def test_hasta_sikayet_benim(client, seeded):
    r = client.post(
        "/sikayet-oneri/",
        headers=_hasta_auth(seeded["hasta_a"]),
        json={"tur": "SIKAYET", "icerik": "Test şikayet mobil takip"},
    )
    assert r.status_code == 201
    sid = r.json()["id"]
    r = client.get("/sikayet-oneri/benim", headers=_hasta_auth(seeded["hasta_a"]))
    assert r.status_code == 200
    assert any(i["id"] == sid for i in r.json()["items"])
