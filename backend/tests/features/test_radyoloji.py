"""Radyoloji istem ve RBAC."""

from app.core.public_id import hasta_public_id_from_pk
from app.core.security import create_access_token
from app.features.kullanicilar.models import Kullanici


def auth_header(user: Kullanici) -> dict[str, str]:
    token = create_access_token(user.id, user.rol)
    return {"Authorization": f"Bearer {token}"}


def test_doktor_radyoloji_istem_olustur(client, session, seeded):
    hasta_uuid = hasta_public_id_from_pk(session, seeded["hasta_a_entity"].id)
    doktor = seeded["doktor_a_entity"]
    r = client.post(
        "/radyoloji/istemler",
        headers=auth_header(seeded["doktor_a"]),
        json={
            "hasta_id": str(hasta_uuid),
            "isteyen_doktor_id": doktor.id,
            "tetkik_turu": "BT",
            "vucut_bolgesi": "Toraks",
            "aciliyet": "RUTIN",
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["tetkik_turu"] == "BT"
    assert body["durum"] == "ISTENDI"


def test_laborant_radyoloji_istem_403(client, seeded):
    r = client.post(
        "/radyoloji/istemler",
        headers=auth_header(seeded["laborant"]),
        json={
            "hasta_id": "00000000-0000-0000-0000-000000000001",
            "isteyen_doktor_id": 1,
            "tetkik_turu": "MR",
            "vucut_bolgesi": "Beyin",
        },
    )
    assert r.status_code == 403
