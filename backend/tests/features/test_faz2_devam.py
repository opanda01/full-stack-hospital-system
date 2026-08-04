"""Faz 2 devam: özel kimlik, izolasyon, E-Nabız, sevk katkı payı."""

from datetime import datetime, timezone

from sqlmodel import select

from app.core.enums import IzolasyonTipi, KlinikDurum, YatakDurumu
from app.features.entegrasyonlar.outbox_models import EntegrasyonGonderim
from app.features.faturalandirma.models import Fatura, FaturaKalemi
from app.features.yatak_yonetimi.models import Oda, Servis, Yatak
from app.features.yatis.models import YatisKaydi
from tests.conftest import auth_header


def test_ozel_kimlik_yabanci(client, seeded):
    admin = seeded["admin"]
    r = client.post(
        "/hastalar/ozel-kimlik",
        headers=auth_header(admin),
        json={
            "kimlik_tipi": "YABANCI_PASAPORT",
            "ad": "John",
            "soyad": "Doe",
            "yabanci_kimlik_no": "P12345678",
            "email": "john.doe@example.com",
            "sifre": "Test1234!",
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["kimlik_tipi"] == "YABANCI_PASAPORT"
    assert body["yabanci_kimlik_no"] == "P12345678"
    assert len(body["tc_kimlik_no"]) == 11


def test_yatak_izolasyon_uyumsuz(client, session, seeded):
    hemsire = seeded["hemsire"]
    servis = Servis(
        ad="Enfeksiyon",
        kod="ENF-1",
        departman_id=seeded["dep_a"].id,
    )
    session.add(servis)
    session.commit()
    session.refresh(servis)
    oda = Oda(servis_id=servis.id, oda_no="401")
    session.add(oda)
    session.commit()
    session.refresh(oda)
    yatak = Yatak(
        oda_id=oda.id,
        yatak_no="1",
        durum=YatakDurumu.BOS,
        izolasyon_tipi=IzolasyonTipi.YOK,
    )
    session.add(yatak)
    session.commit()
    session.refresh(yatak)

    yatis = YatisKaydi(
        hasta_id=seeded["hasta_a_entity"].id,
        servis_id=servis.id,
        protokol_no="IZ-001",
        yatis_tarihi=datetime.now(timezone.utc),
        klinik_durum=KlinikDurum.NORMAL,
        aktif_mi=True,
        izolasyon_gerekli=IzolasyonTipi.DAMLACIK.value,
    )
    session.add(yatis)
    session.commit()
    session.refresh(yatis)

    r = client.post(
        f"/yatak-yonetimi/yataklar/{yatak.id}/ata",
        headers=auth_header(hemsire),
        json={"yatis_id": yatis.id},
    )
    assert r.status_code == 400


def test_muayene_enabiz_outbox(client, session, seeded):
    doktor = seeded["doktor_b"]
    randevu = seeded["randevu_b"]
    r = client.post(
        "/muayeneler/",
        headers=auth_header(doktor),
        json={"randevu_id": randevu.id, "tani": "E-Nabız tetik test"},
    )
    assert r.status_code == 201, r.text
    outbox = session.exec(
        select(EntegrasyonGonderim).where(EntegrasyonGonderim.sistem == "ENABIZ")
    ).first()
    assert outbox is not None
    assert outbox.kaynak == "muayene"


def test_sevk_katki_payi_fatura(client, session, seeded):
    doktor = seeded["doktor_a"]
    hasta = seeded["hasta_a_entity"]
    r0 = client.post(
        "/klinik-onay/",
        headers=auth_header(doktor),
        json={
            "tur": "SEVK",
            "hasta_id": str(hasta.public_id),
            "icerik": "Üst branşa sevk",
        },
    )
    assert r0.status_code == 201, r0.text
    kayit_id = r0.json()["id"]

    r1 = client.post(
        f"/klinik-onay/{kayit_id}/onayla",
        headers=auth_header(seeded["bashekim"]),
    )
    assert r1.status_code == 200, r1.text

    kalem = session.exec(
        select(FaturaKalemi).where(FaturaKalemi.kod == "SEVK_KATKI_PAYI")
    ).first()
    assert kalem is not None
    fatura = session.get(Fatura, kalem.fatura_id)
    assert fatura is not None
    assert fatura.hasta_id == hasta.id
