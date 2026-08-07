"""Şikayet/öneri durum güncelleme ve özet API."""

from app.core.security import create_access_token
from app.features.kullanicilar.models import Kullanici
from app.features.sikayet_oneri.models import SikayetOneri
from app.features.sikayet_oneri.schemas import SikayetDurum


def auth_header(user: Kullanici) -> dict[str, str]:
    token = create_access_token(user.id, user.rol)
    return {"Authorization": f"Bearer {token}"}


def test_sikayet_durum_guncelle_ve_ozet(client, session, seeded):
    kayit = SikayetOneri(
        gonderen_kullanici_id=seeded["hasta_a"].id,
        tur="SIKAYET",
        icerik="Test şikayet",
        durum=SikayetDurum.ACIK.value,
    )
    session.add(kayit)
    session.commit()
    session.refresh(kayit)

    r = client.patch(
        f"/sikayet-oneri/{kayit.id}/durum",
        headers=auth_header(seeded["bashekim"]),
        json={"durum": SikayetDurum.INCELENIYOR.value, "not": "İnceleniyor"},
    )
    assert r.status_code == 200
    assert r.json()["durum"] == SikayetDurum.INCELENIYOR.value

    cozuldu = SikayetOneri(
        gonderen_kullanici_id=seeded["hasta_b"].id,
        tur="ONERI",
        icerik="Kapanmış öneri",
        durum=SikayetDurum.COZULDU.value,
    )
    session.add(cozuldu)
    session.commit()

    r = client.get(
        "/sikayet-oneri/ozet",
        headers=auth_header(seeded["admin"]),
    )
    assert r.status_code == 200
    ozet = r.json()
    assert ozet["toplam"] == 2
    assert ozet["bekleyen"] == 1
    assert ozet["cozulen"] == 1


def test_sikayet_durum_guncelle_404(client, seeded):
    r = client.patch(
        "/sikayet-oneri/99999/durum",
        headers=auth_header(seeded["admin"]),
        json={"durum": SikayetDurum.COZULDU.value},
    )
    assert r.status_code == 404


def test_sikayet_durum_guncelle_403(client, session, seeded):
    kayit = SikayetOneri(
        gonderen_kullanici_id=seeded["hasta_a"].id,
        tur="SIKAYET",
        icerik="Yetkisiz test",
        durum=SikayetDurum.ACIK.value,
    )
    session.add(kayit)
    session.commit()
    session.refresh(kayit)

    r = client.patch(
        f"/sikayet-oneri/{kayit.id}/durum",
        headers=auth_header(seeded["hemsire"]),
        json={"durum": SikayetDurum.COZULDU.value},
    )
    assert r.status_code == 403


def test_liste_durum_filtresi(client, session, seeded):
    acik = SikayetOneri(
        gonderen_kullanici_id=seeded["hasta_a"].id,
        tur="SIKAYET",
        icerik="Açık",
        durum=SikayetDurum.ACIK.value,
    )
    kapali = SikayetOneri(
        gonderen_kullanici_id=seeded["hasta_b"].id,
        tur="SIKAYET",
        icerik="Kapalı",
        durum=SikayetDurum.COZULDU.value,
    )
    session.add_all([acik, kapali])
    session.commit()

    r = client.get(
        "/sikayet-oneri/",
        headers=auth_header(seeded["admin"]),
        params={"durum": "ACIK", "page_size": 50},
    )
    assert r.status_code == 200
    assert r.json()["total"] == 1
    assert r.json()["items"][0]["durum"] == SikayetDurum.ACIK.value
