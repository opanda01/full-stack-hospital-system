"""Admin dashboard özet, trend ve servis doluluk endpoint testleri."""

from datetime import date, datetime, timedelta, timezone

from app.core.enums import ServisTipi, YatakDurumu
from app.features.nobet_cizelgesi.models import NobetCizelgesi
from app.features.randevular.models import Randevu
from app.features.sikayet_oneri.models import SikayetOneri
from app.features.yatak_yonetimi.models import Oda, Servis, Yatak
from tests.conftest import auth_header


def test_admin_ozet_200(client, seeded):
    r = client.get("/dashboard/admin/ozet", headers=auth_header(seeded["admin"]))
    assert r.status_code == 200
    body = r.json()
    assert body["randevu_bekleyen"] == 2
    assert body["randevu_toplam"] == 2
    assert "sikayet_bekleyen" in body
    assert "temizlik_acik" in body
    assert "yatak_dolu" in body
    assert "aktif_yatis" in body
    assert "nobet_bugun" in body
    assert "randevu_onay_bekleyen" in body


def test_admin_ozet_403_hemsire(client, seeded):
    r = client.get("/dashboard/admin/ozet", headers=auth_header(seeded["hemsire"]))
    assert r.status_code == 403


def test_admin_ozet_401_no_token(client):
    r = client.get("/dashboard/admin/ozet")
    assert r.status_code == 401


def test_admin_trend_zero_fill(client, session, seeded):
    bugun = datetime.now(timezone.utc)
    session.add(
        Randevu(
            hasta_id=seeded["hasta_a"].id,
            doktor_id=seeded["doktor_a"].id,
            departman_id=seeded["dep_a"].id,
            tarih_saat=bugun,
            durum="TAMAMLANDI",
        )
    )
    session.commit()

    r = client.get(
        "/dashboard/admin/trend",
        params={"gun": 7},
        headers=auth_header(seeded["admin"]),
    )
    assert r.status_code == 200
    body = r.json()
    assert len(body["randevu_gunluk"]) == 7
    assert len(body["yatis_gunluk"]) == 7
    assert sum(d["adet"] for d in body["randevu_gunluk"]) >= 1
    assert all(d["adet"] >= 0 for d in body["randevu_gunluk"])


def test_admin_trend_403_doktor(client, seeded):
    r = client.get(
        "/dashboard/admin/trend",
        headers=auth_header(seeded["doktor_a"]),
    )
    assert r.status_code == 403


def test_admin_servis_doluluk_aggregate(client, session, seeded):
    servis = Servis(ad="Dahiliye A", kod="DAH-A", tip=ServisTipi.DAHILIYE)
    session.add(servis)
    session.commit()
    session.refresh(servis)

    oda = Oda(servis_id=servis.id, oda_no="101")
    session.add(oda)
    session.commit()
    session.refresh(oda)

    session.add_all(
        [
            Yatak(oda_id=oda.id, yatak_no="1", durum=YatakDurumu.DOLU),
            Yatak(oda_id=oda.id, yatak_no="2", durum=YatakDurumu.BOS),
            Yatak(oda_id=oda.id, yatak_no="3", durum=YatakDurumu.DOLU),
        ]
    )
    session.commit()

    r = client.get(
        "/dashboard/admin/servis-doluluk",
        headers=auth_header(seeded["admin"]),
    )
    assert r.status_code == 200
    rows = r.json()
    satir = next(s for s in rows if s["servis_id"] == servis.id)
    assert satir["toplam"] == 3
    assert satir["dolu"] == 2
    assert satir["oran"] == round(2 / 3, 2)


def test_admin_servis_doluluk_403_hemsire(client, seeded):
    r = client.get(
        "/dashboard/admin/servis-doluluk",
        headers=auth_header(seeded["hemsire"]),
    )
    assert r.status_code == 403


def test_admin_ozet_extended_counts(client, session, seeded):
    session.add(
        SikayetOneri(
            gonderen_kullanici_id=seeded["hasta_a"].id,
            tur="SIKAYET",
            icerik="Test sikayet",
            durum="ACIK",
        )
    )
    session.add(
        NobetCizelgesi(
            personel_id=seeded["hemsire_entity"].id,
            tarih=date.today(),
            vardiya="GUNDUZ",
            departman_id=seeded["dep_a"].id,
        )
    )
    session.commit()

    r = client.get("/dashboard/admin/ozet", headers=auth_header(seeded["admin"]))
    assert r.status_code == 200
    body = r.json()
    assert body["sikayet_bekleyen"] >= 1
    assert body["temizlik_acik"] >= 2
    assert body["nobet_bugun"] >= 1
