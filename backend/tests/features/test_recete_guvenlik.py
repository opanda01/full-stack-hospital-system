"""Reçete güvenlik ve alerji testleri."""

from sqlmodel import select

from app.core.enums import AlerjiSiddet, AllerjenTipi
from app.features.auth.models import DenetimKaydi
from app.features.hastalar.alerji_models import HastaAlerjisi
from app.features.muayeneler.recete_models import IlacEtkenMaddesi
from tests.conftest import auth_header


def test_recete_hard_stop_alerji(client, session, seeded):
    hasta = seeded["hasta_a_entity"]
    doktor = seeded["doktor_a"]
    randevu = seeded["randevu_a"]

    session.add(
        HastaAlerjisi(
            hasta_id=hasta.id,
            allerjen_tipi=AllerjenTipi.ILAC,
            allerjen_adi="Amoksisilin",
            siddet=AlerjiSiddet.SIDDETLI,
        )
    )
    session.add(
        IlacEtkenMaddesi(
            etken_kodu="PENICILLIN",
            etken_adi="Penisilin",
            urun_adi_eslesme="amoksisilin",
        )
    )
    session.commit()

    r = client.post(
        "/muayeneler/",
        headers=auth_header(doktor),
        json={
            "randevu_id": randevu.id,
            "tani": "Enfeksiyon",
            "recete_kalemleri": [{"urun_adi": "Amoksisilin 500mg", "sira": 1}],
            "uyari_onay": {
                "gerekce": "bilinçli risk alıyorum çünkü alternatif yok",
                "uyari_kodlari": ["ignored"],
            },
        },
    )
    assert r.status_code == 422
    detail = r.json().get("detail") or {}
    assert detail.get("kod") == "RECETE_HARD_STOP"


def test_recete_uyari_gerekce_ve_override_audit(client, session, seeded):
    hasta = seeded["hasta_a_entity"]
    doktor = seeded["doktor_a"]
    randevu = seeded["randevu_a"]

    session.add(
        HastaAlerjisi(
            hasta_id=hasta.id,
            allerjen_tipi=AllerjenTipi.ILAC,
            allerjen_adi="Ibuprofen",
            siddet=AlerjiSiddet.HAFIF,
        )
    )
    session.commit()

    r0 = client.post(
        "/muayeneler/",
        headers=auth_header(doktor),
        json={
            "randevu_id": randevu.id,
            "tani": "Ağrı",
            "recete_kalemleri": [{"urun_adi": "Ibuprofen 400mg", "sira": 1}],
        },
    )
    assert r0.status_code == 422
    d0 = r0.json().get("detail") or {}
    kodlar = [u["kod"] for u in d0.get("uyarilar", [])]
    assert kodlar

    r1 = client.post(
        "/muayeneler/",
        headers=auth_header(doktor),
        json={
            "randevu_id": randevu.id,
            "tani": "Ağrı",
            "recete_kalemleri": [{"urun_adi": "Ibuprofen 400mg", "sira": 1}],
            "uyari_onay": {
                "gerekce": "Hasta tolere ediyor, düşük doz denenecek",
                "uyari_kodlari": kodlar,
            },
        },
    )
    assert r1.status_code == 201, r1.text
    assert len(r1.json()["recete_kalemleri"]) == 1

    audit = session.exec(
        select(DenetimKaydi).where(DenetimKaydi.aksiyon == "RECETE_UYARI_OVERRIDE")
    ).first()
    assert audit is not None


def test_alerji_crud(client, session, seeded):
    hasta = seeded["hasta_a_entity"]
    doktor = seeded["doktor_a"]
    pid = str(hasta.public_id)

    r = client.post(
        f"/hastalar/{pid}/alerjiler",
        headers=auth_header(doktor),
        json={
            "allerjen_tipi": "ILAC",
            "allerjen_adi": "Penisilin",
            "siddet": "ANAFILAKSI",
        },
    )
    assert r.status_code == 201, r.text
    aid = r.json()["id"]

    r2 = client.get(f"/hastalar/{pid}/alerjiler", headers=auth_header(doktor))
    assert r2.status_code == 200
    assert any(a["id"] == aid for a in r2.json())

    r3 = client.delete(
        f"/hastalar/{pid}/alerjiler/{aid}", headers=auth_header(doktor)
    )
    assert r3.status_code == 204
