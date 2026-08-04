"""Muayene zorunlu bildirim bayrakları + denetim."""

from sqlmodel import select

from app.features.auth.models import DenetimKaydi
from tests.conftest import auth_header


def test_muayene_zorunlu_bildirim_audit(client, session, seeded):
    doktor = seeded["doktor_a"]
    randevu = seeded["randevu_a"]

    r = client.post(
        "/muayeneler/",
        headers=auth_header(doktor),
        json={
            "randevu_id": randevu.id,
            "tani": "Bildirim test",
            "bulasici_bildirim_mi": True,
            "adli_vaka_mi": False,
            "olum_bildirim_mi": False,
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["bulasici_bildirim_mi"] is True
    assert body["adli_vaka_mi"] is False
    assert body["olum_bildirim_mi"] is False

    audit = session.exec(
        select(DenetimKaydi).where(DenetimKaydi.aksiyon == "ZORUNLU_BILDIRIM_ISARET")
    ).first()
    assert audit is not None
    assert audit.kaynak_id == str(body["id"])
    assert audit.detay is not None
    assert audit.detay.get("bulasici_bildirim_mi") is True


def test_muayene_bildirim_yoksa_audit_yok(client, session, seeded):
    doktor = seeded["doktor_b"]
    randevu = seeded["randevu_b"]

    once = len(
        list(
            session.exec(
                select(DenetimKaydi).where(
                    DenetimKaydi.aksiyon == "ZORUNLU_BILDIRIM_ISARET"
                )
            ).all()
        )
    )

    r = client.post(
        "/muayeneler/",
        headers=auth_header(doktor),
        json={"randevu_id": randevu.id, "tani": "Normal"},
    )
    assert r.status_code == 201, r.text
    assert r.json()["bulasici_bildirim_mi"] is False

    sonra = len(
        list(
            session.exec(
                select(DenetimKaydi).where(
                    DenetimKaydi.aksiyon == "ZORUNLU_BILDIRIM_ISARET"
                )
            ).all()
        )
    )
    assert sonra == once
