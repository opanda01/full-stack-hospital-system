"""P0 — Başhekim özet ve personel erişim onayı; müdür 403."""

from app.core.enums import ErisimDurumu, Rol
from app.core.security import create_access_token, hash_password
from app.features.kullanicilar.models import Kullanici
from app.features.personel.erisim_service import apply_erisim_durumu
from app.features.personel.models import Personel
from app.features.bashekim.router import invalidate_bashekim_ozet


def auth_header(user: Kullanici) -> dict[str, str]:
    token = create_access_token(user.id, user.rol)
    return {"Authorization": f"Bearer {token}"}


def _mudur(session) -> Kullanici:
    u = Kullanici(
        tc_kimlik_no="88888888882",
        ad="Test",
        soyad="MudurB",
        email="mudur-bashekim@t.test",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.MUDUR,
        aktif_mi=True,
    )
    session.add(u)
    session.commit()
    session.refresh(u)
    return u


def test_bashekim_ozet_200(client, seeded):
    invalidate_bashekim_ozet()
    r = client.get("/bashekim/ozet", headers=auth_header(seeded["bashekim"]))
    assert r.status_code == 200
    body = r.json()
    assert "bekleyen_erisim" in body
    assert "bugun_randevu" in body
    assert "bekleyen_klinik_onay" in body
    assert "son_denetim" in body
    assert body["cache_ttl_sec"] == 45


def test_mudur_bashekim_ozet_403(client, session, seeded):
    mudur = _mudur(session)
    r = client.get("/bashekim/ozet", headers=auth_header(mudur))
    assert r.status_code == 403


def test_bashekim_erisim_onayla(client, session, seeded):
    bekleyen = Kullanici(
        tc_kimlik_no="89999999991",
        ad="Bekleyen",
        soyad="Personel",
        email="bekleyen@t.test",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.IDARI_PERSONEL,
        aktif_mi=False,
    )
    apply_erisim_durumu(bekleyen, ErisimDurumu.BEKLEMEDE)
    session.add(bekleyen)
    session.commit()
    session.refresh(bekleyen)

    personel = Personel(
        kullanici_id=bekleyen.id,
        sicil_no="BEK-001",
        departman_id=seeded["dep_a"].id,
        unvan="İdari",
    )
    session.add(personel)
    session.commit()
    session.refresh(personel)

    r = client.get(
        "/personel/erisim-talepleri",
        params={"durum": ErisimDurumu.BEKLEMEDE.value},
        headers=auth_header(seeded["bashekim"]),
    )
    assert r.status_code == 200
    assert any(t["personel_id"] == personel.id for t in r.json())

    r = client.post(
        f"/personel/erisim-talepleri/{personel.id}/onayla",
        headers=auth_header(seeded["bashekim"]),
    )
    assert r.status_code == 200
    assert r.json()["erisim_durumu"] == ErisimDurumu.ONAYLANDI.value

    mudur = _mudur(session)
    # Yeni bekleyen — müdür onaylayamaz
    bekleyen2 = Kullanici(
        tc_kimlik_no="89999999992",
        ad="Bekleyen2",
        soyad="Personel",
        email="bekleyen2@t.test",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.IDARI_PERSONEL,
        aktif_mi=False,
    )
    apply_erisim_durumu(bekleyen2, ErisimDurumu.BEKLEMEDE)
    session.add(bekleyen2)
    session.commit()
    session.refresh(bekleyen2)
    p2 = Personel(
        kullanici_id=bekleyen2.id,
        sicil_no="BEK-002",
        departman_id=seeded["dep_a"].id,
        unvan="İdari",
    )
    session.add(p2)
    session.commit()
    session.refresh(p2)

    r = client.post(
        f"/personel/erisim-talepleri/{p2.id}/onayla",
        headers=auth_header(mudur),
    )
    assert r.status_code == 403
