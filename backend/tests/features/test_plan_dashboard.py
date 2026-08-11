"""Dashboard özet endpoint testleri."""


def test_laborant_ozet(client, session, seeded):
    from tests.conftest import auth_header

    r = client.get(
        "/dashboard/laborant/ozet",
        headers=auth_header(seeded["laborant"]),
    )
    assert r.status_code == 200
    body = r.json()
    assert "bekleyen_tetkik" in body
    assert "toplam_tetkik" in body


def test_idari_ozet(client, session, seeded):
    from app.core.enums import Rol
    from tests.conftest import _test_tc, _user, auth_header

    idari = _user(
        session,
        email="idari@t.test",
        rol=Rol.IDARI_PERSONEL,
        tc=_test_tc("888888881"),
        soyad="Idari",
    )
    r = client.get(
        "/dashboard/idari/ozet",
        headers=auth_header(idari),
    )
    assert r.status_code == 200
    assert "bugun_hasta_kayit" in r.json()


def test_analytics_ozet_bashekim(client, session, seeded):
    from tests.conftest import auth_header

    r = client.get(
        "/dashboard/analytics/ozet",
        headers=auth_header(seeded["bashekim"]),
    )
    assert r.status_code == 200
    body = r.json()
    assert "tetkik_durumlari" in body
    assert "yatak_dolu" in body


def test_zorunlu_bildirim_list(client, session, seeded):
    from tests.conftest import auth_header

    r = client.get(
        "/muayeneler/zorunlu-bildirimler",
        headers=auth_header(seeded["admin"]),
    )
    assert r.status_code == 200
    assert isinstance(r.json(), list)
