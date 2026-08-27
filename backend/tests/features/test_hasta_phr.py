"""Hasta PHR: onaylı klinik belge, özet, şikâyet benim."""

from app.core.enums import Rol
from app.core.security import create_access_token
from app.core.enums import OturumTipi


def _hasta_auth(user) -> dict[str, str]:
    token = create_access_token(
        user.id, user.rol, oturum_tipi=OturumTipi.HASTA
    )
    return {"Authorization": f"Bearer {token}"}


def test_hasta_onayli_klinik_belge_goruntule(client, seeded):
    r = client.post(
        "/klinik-onay/",
        headers={
            "Authorization": f"Bearer {create_access_token(seeded['doktor_a'].id, seeded['doktor_a'].rol)}"
        },
        json={
            "tur": "RECETE",
            "hasta_id": str(seeded["hasta_a_entity"].public_id),
            "icerik": "Mobil hasta test reçetesi",
        },
    )
    assert r.status_code == 201
    kayit_id = r.json()["id"]
    r = client.post(
        f"/klinik-onay/{kayit_id}/onayla",
        headers={
            "Authorization": f"Bearer {create_access_token(seeded['bashekim'].id, seeded['bashekim'].rol)}"
        },
    )
    assert r.status_code == 200

    r = client.get("/klinik-onay/", headers=_hasta_auth(seeded["hasta_a"]))
    assert r.status_code == 200
    items = r.json()["items"]
    assert any(i["id"] == kayit_id and i["tur"] == "RECETE" for i in items)

    r = client.get("/hastalar/ben/belgeler", headers=_hasta_auth(seeded["hasta_a"]))
    assert r.status_code == 200
    belgeler = r.json()["items"]
    assert any(
        b["kaynak"] == "KLINIK_ONAY" and b["id"] == kayit_id for b in belgeler
    )


def test_hasta_ozet_endpoint(client, seeded):
    r = client.get("/hastalar/ben/ozet", headers=_hasta_auth(seeded["hasta_a"]))
    assert r.status_code == 200
    body = r.json()
    assert "ad_soyad" in body
    assert "okunmamis_sonuc_sayisi" in body


def test_hasta_ozet_yatis_kaydi_ile(client, session, seeded):
    """Yatış kaydı olan hastada özet 500 vermemeli (cikis_tarihi → taburcu_tarihi)."""
    from datetime import datetime, timezone

    from app.core.enums import KlinikDurum
    from app.features.yatak_yonetimi.models import Servis
    from app.features.yatis.models import YatisKaydi

    servis = Servis(ad="Test Servis", kod="TS-1", kat_no=1, departman_id=seeded["dep_a"].id)
    session.add(servis)
    session.commit()
    session.refresh(servis)

    yatis = YatisKaydi(
        hasta_id=seeded["hasta_a_entity"].id,
        servis_id=servis.id,
        protokol_no="PR-OZET-001",
        yatis_tarihi=datetime.now(timezone.utc),
        cikis_tarihi=None,
        klinik_durum=KlinikDurum.NORMAL,
        aktif_mi=True,
    )
    session.add(yatis)
    session.commit()

    r = client.get("/hastalar/ben/ozet", headers=_hasta_auth(seeded["hasta_a"]))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["yatis"] is not None
    assert body["yatis"]["aktif_mi"] is True
    assert body["yatis"]["taburcu_tarihi"] is None


def test_hasta_oturumunda_personel_rolu_ile_ozet(client, seeded):
    """OTP hasta oturumu: DB rolü personel olsa da KENDI_KAYDIM hasta filtresi."""
    doktor = seeded["doktor_a"]
    token = create_access_token(doktor.id, doktor.rol, oturum_tipi=OturumTipi.HASTA)
    r = client.get(
        "/hastalar/ben/ozet",
        headers={"Authorization": f"Bearer {token}"},
    )
    if r.status_code == 403 and "Hasta kaydı" in r.json().get("detail", ""):
        return
    assert r.status_code == 200, r.text


def test_hasta_sikayet_benim(client, seeded):
    r = client.post(
        "/sikayet-oneri/",
        headers=_hasta_auth(seeded["hasta_a"]),
        json={"tur": "SIKAYET", "icerik": "Test şikayet mobil takip"},
    )
    assert r.status_code == 201
    sid = r.json()["id"]
    r = client.get("/sikayet-oneri/benim", headers=_hasta_auth(seeded["hasta_a"]))
    assert r.status_code == 200
    assert any(i["id"] == sid for i in r.json()["items"])
