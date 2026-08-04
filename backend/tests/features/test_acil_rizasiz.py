"""Acil rızasız müdahale (iki hekim) testleri."""

from sqlmodel import select

from app.features.auth.models import DenetimKaydi
from tests.conftest import auth_header


def test_acil_rizasiz_iki_hekim_ve_bilgilendirme(client, session, seeded):
    doktor_a = seeded["doktor_a"]
    doktor_b = seeded["doktor_b"]
    hasta = seeded["hasta_a_entity"]

    r0 = client.post(
        "/klinik-onay/",
        headers=auth_header(doktor_a),
        json={
            "tur": "ACIL_RIZASIZ",
            "hasta_id": str(hasta.public_id),
            "icerik": "Bilinçsiz hasta, acil cerrahi müdahale gerekli",
            "ikinci_hekim_id": doktor_b.id,
        },
    )
    assert r0.status_code == 201, r0.text
    body = r0.json()
    assert body["tur"] == "ACIL_RIZASIZ"
    assert body["onay_durumu"] == "ONAYLANDI"
    assert body["olusturan_id"] == doktor_a.id
    assert body["ikinci_onaylayan_id"] == doktor_b.id
    assert body["bilgilendirme_yapildi_mi"] is False

    audit = session.exec(
        select(DenetimKaydi).where(DenetimKaydi.aksiyon == "ACIL_RIZASIZ_ONAY")
    ).first()
    assert audit is not None

    r1 = client.post(
        f"/klinik-onay/{body['id']}/bilgilendir",
        headers=auth_header(doktor_a),
        json={"notu": "Yakını arandı, bilgilendirildi"},
    )
    assert r1.status_code == 200, r1.text
    assert r1.json()["bilgilendirme_yapildi_mi"] is True
    assert r1.json()["bilgilendirme_notu"] == "Yakını arandı, bilgilendirildi"


def test_acil_rizasiz_ayni_hekim_red(client, seeded):
    doktor_a = seeded["doktor_a"]
    hasta = seeded["hasta_a_entity"]
    r = client.post(
        "/klinik-onay/",
        headers=auth_header(doktor_a),
        json={
            "tur": "ACIL_RIZASIZ",
            "hasta_id": str(hasta.public_id),
            "icerik": "Acil müdahale gerekçesi yeterince uzun",
            "ikinci_hekim_id": doktor_a.id,
        },
    )
    assert r.status_code == 400
