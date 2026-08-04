"""Lab panic bildirim testleri."""

from sqlmodel import select

from app.core.enums import PanelBildirimTipi
from app.features.yatis.models import PanelBildirim
from tests.conftest import auth_header


def test_lab_panic_bildirim_isteyen_doktora(client, session, seeded):
    tetkik = seeded["tetkik_a"]
    lab = seeded["laborant"]
    doktor = seeded["doktor_a"]

    r = client.patch(
        f"/tetkikler/{tetkik.public_id}/sonuc",
        headers=auth_header(lab),
        json={
            "durum": "SONUCLANDI",
            "sonuc_kalemleri": [
                {
                    "parametre_adi": "Potasyum",
                    "deger_sayisal": 7.5,
                    "birim": "mmol/L",
                    "ref_min": 3.5,
                    "ref_max": 5.1,
                    "panic_min": 2.5,
                    "panic_max": 6.5,
                }
            ],
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    kalem = body["sonuc_kalemleri"][0]
    assert kalem["panic_mi"] is True
    assert kalem["anormal_mi"] is True

    bildirimler = list(
        session.exec(
            select(PanelBildirim).where(
                PanelBildirim.alici_id == doktor.id,
                PanelBildirim.tip == PanelBildirimTipi.KRITIK_LAB.value,
            )
        ).all()
    )
    assert len(bildirimler) >= 1
    assert "Potasyum" in bildirimler[0].govde


def test_lab_normal_no_panic_bildirim(client, session, seeded):
    tetkik = seeded["tetkik_b"]
    lab = seeded["laborant"]
    doktor_b = seeded["doktor_b"]

    once = len(
        list(
            session.exec(
                select(PanelBildirim).where(
                    PanelBildirim.alici_id == doktor_b.id,
                    PanelBildirim.tip == PanelBildirimTipi.KRITIK_LAB.value,
                )
            ).all()
        )
    )

    r = client.patch(
        f"/tetkikler/{tetkik.public_id}/sonuc",
        headers=auth_header(lab),
        json={
            "durum": "SONUCLANDI",
            "sonuc_kalemleri": [
                {
                    "parametre_adi": "Sodyum",
                    "deger_sayisal": 140,
                    "birim": "mmol/L",
                    "ref_min": 135,
                    "ref_max": 145,
                    "panic_min": 120,
                    "panic_max": 160,
                }
            ],
        },
    )
    assert r.status_code == 200
    assert r.json()["sonuc_kalemleri"][0]["panic_mi"] is False

    sonra = list(
        session.exec(
            select(PanelBildirim).where(
                PanelBildirim.alici_id == doktor_b.id,
                PanelBildirim.tip == PanelBildirimTipi.KRITIK_LAB.value,
            )
        ).all()
    )
    assert len(sonra) == once
