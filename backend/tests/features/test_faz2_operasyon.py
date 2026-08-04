"""Faz 2 operasyonel testleri: provizyon, MHRS, no-show, triyaj."""

from datetime import datetime, timedelta, timezone

from sqlmodel import select

from app.core.enums import TriyajRenk
from app.features.auth.models import DenetimKaydi
from app.features.entegrasyonlar.outbox_models import EntegrasyonGonderim
from app.features.faturalandirma.models import Fatura
from app.features.hastalar.models import Hasta
from tests.conftest import auth_header


def test_medula_provizyon_randevu(client, session, seeded):
    randevu = seeded["randevu_a"]
    hemsire = seeded["hemsire"]
    r = client.post(
        f"/randevular/{randevu.public_id}/provizyon",
        headers=auth_header(hemsire),
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["medula_provizyon_no"]
    assert body["medula_takip_no"]

    audit = session.exec(
        select(DenetimKaydi).where(DenetimKaydi.aksiyon == "MEDULA_PROVIZYON")
    ).first()
    assert audit is not None
    outbox = session.exec(
        select(EntegrasyonGonderim).where(EntegrasyonGonderim.sistem == "MEDULA")
    ).first()
    assert outbox is not None
    fatura = session.exec(select(Fatura).where(Fatura.durum == "PROVIZYON")).first()
    assert fatura is not None


def test_mhrs_randevu_eslestirme(client, session, seeded):
    randevu = seeded["randevu_b"]
    bashekim = seeded["bashekim"]
    r = client.post(
        f"/randevular/{randevu.public_id}/mhrs",
        headers=auth_header(bashekim),
    )
    assert r.status_code == 200, r.text
    assert r.json()["mhrs_randevu_id"].startswith("MHRS-")


def test_no_show_limit_engeli(client, session, seeded):
    hasta = seeded["hasta_a_entity"]
    hasta.gelmeyen_randevu_sayisi = 3
    session.add(hasta)
    session.commit()

    hasta_u = seeded["hasta_a"]
    r = client.post(
        "/randevular/",
        headers=auth_header(hasta_u),
        json={
            "hasta_id": str(hasta.public_id),
            "doktor_id": seeded["doktor_a_entity"].id,
            "departman_id": seeded["dep_a"].id,
            "tarih_saat": "2031-06-01T10:00:00+03:00",
        },
    )
    assert r.status_code == 400


def test_gelmedi_isaretle_sayac(client, session, seeded):
    randevu = seeded["randevu_a"]
    randevu.tarih_saat = datetime.now(timezone.utc) - timedelta(hours=2)
    randevu.durum = "BEKLEMEDE"
    session.add(randevu)
    session.commit()
    hasta = session.get(Hasta, randevu.hasta_id)
    assert hasta is not None
    once = int(hasta.gelmeyen_randevu_sayisi or 0)

    r = client.post(
        f"/randevular/{randevu.public_id}/gelmedi",
        headers=auth_header(seeded["hemsire"]),
    )
    assert r.status_code == 200, r.text
    assert r.json()["durum"] == "GELMEDI"
    session.refresh(hasta)
    assert hasta.gelmeyen_randevu_sayisi == once + 1


def test_acil_triyaj_kaydi(client, session, seeded):
    hemsire = seeded["hemsire"]
    hasta = seeded["hasta_a_entity"]
    r = client.post(
        "/acil/triyaj",
        headers=auth_header(hemsire),
        json={
            "hasta_id": str(hasta.public_id),
            "sikayet_ozet": "Göğüs ağrısı, nefes darlığı",
            "renk": TriyajRenk.KIRMIZI.value,
            "ats_skor": 2,
        },
    )
    assert r.status_code == 201, r.text
    assert r.json()["renk"] == "KIRMIZI"

    audit = session.exec(
        select(DenetimKaydi).where(DenetimKaydi.aksiyon == "ACIL_TRIYAJ")
    ).first()
    assert audit is not None
