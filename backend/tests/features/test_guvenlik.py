"""Güvenlik paneli API smoke testleri."""

from sqlmodel import Session

from app.core.enums import Rol
from app.core.permissions import Kapsam, kapsam_getir
from app.core.security import create_access_token, hash_password
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel


def auth_header(user: Kullanici) -> dict[str, str]:
    token = create_access_token(user.id, user.rol)
    return {"Authorization": f"Bearer {token}"}


def _guvenlik_user(session: Session) -> Kullanici:
    user = Kullanici(
        tc_kimlik_no="90000000701",
        ad="Test",
        soyad="Güvenlik",
        email="guvenlik-api@t.test",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.GUVENLIK,
        aktif_mi=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    session.add(
        Personel(
            kullanici_id=user.id,
            sicil_no="GUV-API-1",
            unvan="Güvenlik",
        )
    )
    session.commit()
    return user


def test_guvenlik_ozet_ve_olay_akisi(client, session):
    user = _guvenlik_user(session)
    headers = auth_header(user)

    r = client.get("/guvenlik/ozet", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert "acik_olay" in body
    assert "bugun_cozulen" in body

    r = client.post(
        "/guvenlik/olaylar",
        headers=headers,
        json={
            "tip": "BEYAZ_KOD",
            "yer": "Acil servis",
            "ozet": "Sözlü tartışma",
            "kolluk_bilgilendirildi": False,
        },
    )
    assert r.status_code == 201
    olay_id = r.json()["id"]

    r = client.get("/guvenlik/olaylar", headers=headers)
    assert r.status_code == 200
    assert any(o["id"] == olay_id for o in r.json())

    r = client.patch(
        f"/guvenlik/olaylar/{olay_id}",
        headers=headers,
        json={"durum": "COZULDU", "mudahale_notu": "Sakinleştirildi"},
    )
    assert r.status_code == 200
    assert r.json()["durum"] == "COZULDU"

    r = client.post(
        "/guvenlik/ziyaretciler",
        headers=headers,
        json={
            "ad_soyad": "Ali Veli",
            "ziyaret_edilen": "Hasta A",
            "servis": "Dahiliye",
        },
    )
    assert r.status_code == 201
    zid = r.json()["id"]

    r = client.post(f"/guvenlik/ziyaretciler/{zid}/cikis", headers=headers)
    assert r.status_code == 200
    assert r.json()["cikis_zamani"] is not None

    r = client.post(
        "/guvenlik/kayip-esyalar",
        headers=headers,
        json={"tanim": "Siyah cüzdan", "bulunan_yer": "Poliklinik holü"},
    )
    assert r.status_code == 201

    r = client.post(
        "/guvenlik/devriyeler",
        headers=headers,
        json={"bolge": "Ana giriş", "bulgu": "Normal"},
    )
    assert r.status_code == 201


def test_mudur_olay_izin_matrisi():
    assert kapsam_getir(Rol.MUDUR, "guvenlik_olay:goruntule") == Kapsam.GLOBAL
    assert kapsam_getir(Rol.MUDUR, "guvenlik_olay:olustur") == Kapsam.YOK
