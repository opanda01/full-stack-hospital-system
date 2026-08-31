"""Raporlar modülü yetki testleri."""

from tests.conftest import auth_header


def test_rapor_randevu_401(client):
    r = client.get("/raporlar/randevu")
    assert r.status_code == 401


def test_rapor_randevu_403_doktor(client, seeded):
    r = client.get("/raporlar/randevu", headers=auth_header(seeded["doktor_a"]))
    assert r.status_code == 403


def test_rapor_randevu_200_admin(client, seeded):
    r = client.get("/raporlar/randevu", headers=auth_header(seeded["admin"]))
    assert r.status_code == 200
    body = r.json()
    assert "toplam" in body
    assert "durum_dagilimi" in body
    assert "gunluk_adet" in body


def test_rapor_yatis_200_bashekim(client, seeded):
    r = client.get("/raporlar/yatis", headers=auth_header(seeded["bashekim"]))
    assert r.status_code == 200
    assert "aktif_yatis" in r.json()


def test_rapor_finans_403_hemsire(client, seeded):
    """Hemşire fatura:goruntule yetkisi olmadan finans raporuna erişemez."""
    r = client.get("/raporlar/finans", headers=auth_header(seeded["hemsire"]))
    assert r.status_code == 403


def test_rapor_finans_200_bashekim(client, seeded):
    r = client.get("/raporlar/finans", headers=auth_header(seeded["bashekim"]))
    assert r.status_code == 200
    body = r.json()
    assert "fatura_toplam" in body
    assert "toplam_tutar" in body


def test_rapor_klinik_200_admin(client, seeded):
    r = client.get("/raporlar/klinik", headers=auth_header(seeded["admin"]))
    assert r.status_code == 200
    body = r.json()
    assert "tetkik_durum_dagilimi" in body
    assert "sikayet_bekleyen" in body


def test_rapor_randevu_export_csv(client, seeded):
    r = client.get(
        "/raporlar/randevu/export",
        params={"format": "csv"},
        headers=auth_header(seeded["admin"]),
    )
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")
    assert b"toplam" in r.content or b"metrik" in r.content


def test_rapor_randevu_export_pdf(client, seeded):
    r = client.get(
        "/raporlar/randevu/export",
        params={"format": "pdf"},
        headers=auth_header(seeded["admin"]),
    )
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("application/pdf")
    assert r.content[:4] == b"%PDF"
