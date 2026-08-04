"""Veli/vasi KVKK onam kapısı testleri."""

from datetime import date, datetime

from sqlmodel import select

from app.core.enums import KvkkMetinTur
from app.core.tc_kimlik import tc_ilk_dokuz_haneden
from app.features.auth.models import DenetimKaydi
from app.features.kvkk.models import KvkkMetni, KvkkOnayKaydi
from tests.conftest import auth_header


def _seed_kvkk_metin(session):
    m = KvkkMetni(
        tur=KvkkMetinTur.ACIK_RIZA,
        versiyon="t-1.0",
        baslik="Açık Rıza",
        govde="Test metni",
        yururluk_tarihi=datetime.utcnow(),
        aktif_mi=True,
    )
    session.add(m)
    session.commit()
    session.refresh(m)
    return m


def test_resit_olmayan_kvkk_temsilci_zorunlu(client, session, seeded):
    _seed_kvkk_metin(session)
    hasta_u = seeded["hasta_a"]
    ha = seeded["hasta_a_entity"]
    ha.dogum_tarihi = date(date.today().year - 10, 1, 15)
    hasta_u.kvkk_onaylandi_mi = False
    hasta_u.email = "hastaa-veli@example.com"
    session.add(ha)
    session.add(hasta_u)
    session.commit()

    r0 = client.post(
        "/auth/kvkk-onay",
        headers=auth_header(hasta_u),
        json={"onay": True},
    )
    assert r0.status_code == 400
    assert "yasal temsilci" in r0.json()["detail"].lower()

    r1 = client.post(
        "/auth/kvkk-onay",
        headers=auth_header(hasta_u),
        json={
            "onay": True,
            "temsilci_ad_soyad": "Anne Hasta",
            "temsilci_tur": "VELI",
            "temsilci_tc_kimlik_no": tc_ilk_dokuz_haneden("120000001"),
        },
    )
    assert r1.status_code == 200, r1.text
    assert r1.json()["kvkk_onaylandi_mi"] is True

    kayit = session.exec(
        select(KvkkOnayKaydi).where(KvkkOnayKaydi.kullanici_id == hasta_u.id)
    ).first()
    assert kayit is not None
    assert kayit.temsilci_ad_soyad == "Anne Hasta"
    assert kayit.temsilci_tur == "VELI"

    audit = session.exec(
        select(DenetimKaydi).where(
            DenetimKaydi.aksiyon == "KVKK_ONAY",
            DenetimKaydi.actor_id == hasta_u.id,
        )
    ).first()
    assert audit is not None


def test_yasal_temsilci_crud_hasta(client, session, seeded):
    hasta_u = seeded["hasta_b"]
    r = client.post(
        "/hastalar/ben/yasal-temsilciler",
        headers=auth_header(hasta_u),
        json={
            "tur": "VASI",
            "ad_soyad": "Vasi Kişi",
            "tc_kimlik_no": tc_ilk_dokuz_haneden("120000002"),
            "yakinlik": "amca",
        },
    )
    assert r.status_code == 201, r.text
    assert r.json()["tur"] == "VASI"

    r2 = client.get(
        "/hastalar/ben/yasal-temsilciler",
        headers=auth_header(hasta_u),
    )
    assert r2.status_code == 200
    assert any(x["ad_soyad"] == "Vasi Kişi" for x in r2.json())
