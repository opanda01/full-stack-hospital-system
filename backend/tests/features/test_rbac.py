"""RBAC izin matrisi + sahiplik testleri."""

from app.core.enums import Rol
from app.core.permissions import Kapsam, kapsam_getir
from app.core.security import create_access_token
from app.features.kullanicilar.models import Kullanici


def auth_header(user: Kullanici) -> dict[str, str]:
    token = create_access_token(user.id, user.rol)
    return {"Authorization": f"Bearer {token}"}


# --- Matris birim testleri ---

def test_admin_global_wildcard():
    assert kapsam_getir(Rol.ADMIN, "randevu:goruntule") == Kapsam.GLOBAL
    assert kapsam_getir(Rol.ADMIN, "kullanici:sil") == Kapsam.GLOBAL


def test_doktor_randevu_goruntule_kendi():
    assert kapsam_getir(Rol.DOKTOR, "randevu:goruntule") == Kapsam.KENDI_KAYDIM


def test_doktor_randevu_olustur_yok():
    assert kapsam_getir(Rol.DOKTOR, "randevu:olustur") == Kapsam.YOK


def test_hemsire_randevu_departman():
    assert kapsam_getir(Rol.HEMSIRE, "randevu:goruntule") == Kapsam.DEPARTMANIM


def test_hasta_tetkik_kendi():
    assert kapsam_getir(Rol.HASTA, "tetkik:goruntule") == Kapsam.KENDI_KAYDIM


def test_temizlik_guncelle_kendi():
    assert kapsam_getir(Rol.TEMIZLIK_PERSONELI, "temizlik_gorevi:guncelle") == Kapsam.KENDI_KAYDIM


def test_laborant_tetkik_iste_yok():
    assert kapsam_getir(Rol.LABORANT, "tetkik:iste") == Kapsam.YOK


# --- HTTP: yetkili / yetkisiz ---

def test_randevu_liste_admin_200(client, seeded):
    r = client.get("/randevular/", headers=auth_header(seeded["admin"]))
    assert r.status_code == 200
    assert len(r.json()) >= 2


def test_randevu_liste_laborant_403(client, seeded):
    r = client.get("/randevular/", headers=auth_header(seeded["laborant"]))
    assert r.status_code == 403


def test_randevu_olustur_hasta_201(client, seeded):
    body = {
        "hasta_id": seeded["hasta_a_entity"].id,
        "doktor_id": seeded["doktor_a_entity"].id,
        "departman_id": seeded["dep_a"].id,
        "tarih_saat": "2030-01-15T10:00:00",
        "notlar": None,
    }
    r = client.post("/randevular/", json=body, headers=auth_header(seeded["hasta_a"]))
    assert r.status_code == 201


def test_randevu_olustur_doktor_403(client, seeded):
    body = {
        "hasta_id": seeded["hasta_a_entity"].id,
        "doktor_id": seeded["doktor_a_entity"].id,
        "departman_id": seeded["dep_a"].id,
        "tarih_saat": "2030-01-16T10:00:00",
    }
    r = client.post("/randevular/", json=body, headers=auth_header(seeded["doktor_a"]))
    assert r.status_code == 403


def test_tetkik_iste_doktor_201(client, seeded):
    body = {
        "hasta_id": seeded["hasta_a_entity"].id,
        "istek_yapan_doktor_id": seeded["doktor_a_entity"].id,
        "tetkik_turu": "EKG",
    }
    r = client.post("/tetkikler/", json=body, headers=auth_header(seeded["doktor_a"]))
    assert r.status_code == 201


def test_tetkik_iste_hasta_403(client, seeded):
    body = {
        "hasta_id": seeded["hasta_a_entity"].id,
        "istek_yapan_doktor_id": seeded["doktor_a_entity"].id,
        "tetkik_turu": "EKG",
    }
    r = client.post("/tetkikler/", json=body, headers=auth_header(seeded["hasta_a"]))
    assert r.status_code == 403


def test_temizlik_ata_bashekim_201(client, seeded):
    body = {
        "personel_id": seeded["gorev_a"].personel_id,
        "oda_bolum": "303",
        "gorev_tarihi": "2030-02-01",
    }
    r = client.post(
        "/temizlik-gorevleri/", json=body, headers=auth_header(seeded["bashekim"])
    )
    assert r.status_code == 201


def test_temizlik_ata_doktor_403(client, seeded):
    body = {
        "personel_id": seeded["gorev_a"].personel_id,
        "oda_bolum": "303",
        "gorev_tarihi": "2030-02-01",
    }
    r = client.post(
        "/temizlik-gorevleri/", json=body, headers=auth_header(seeded["doktor_a"])
    )
    assert r.status_code == 403


def test_sikayet_gonder_izin_matrisi():
    for rol in Rol:
        assert kapsam_getir(rol, "sikayet_oneri:gonder") != Kapsam.YOK


def test_sikayet_tumunu_goruntule_hasta_yok():
    assert kapsam_getir(Rol.HASTA, "sikayet_oneri:tumunu_goruntule") == Kapsam.YOK


def test_sikayet_tumunu_goruntule_mudur_global():
    assert kapsam_getir(Rol.MUDUR, "sikayet_oneri:tumunu_goruntule") == Kapsam.GLOBAL


# --- Sahiplik senaryoları ---

def test_doktor_baska_doktor_randevu_get_403(client, seeded):
    r = client.get(
        f"/randevular/{seeded['randevu_b'].id}",
        headers=auth_header(seeded["doktor_a"]),
    )
    assert r.status_code == 403


def test_doktor_baska_doktor_randevu_delete_403(client, seeded):
    r = client.delete(
        f"/randevular/{seeded['randevu_b'].id}",
        headers=auth_header(seeded["doktor_a"]),
    )
    assert r.status_code == 403


def test_doktor_kendi_randevu_get_200(client, seeded):
    r = client.get(
        f"/randevular/{seeded['randevu_a'].id}",
        headers=auth_header(seeded["doktor_a"]),
    )
    assert r.status_code == 200


def test_hasta_baska_tetkik_403(client, seeded):
    r = client.get(
        f"/tetkikler/{seeded['tetkik_b'].id}",
        headers=auth_header(seeded["hasta_a"]),
    )
    assert r.status_code == 403


def test_hasta_kendi_tetkik_200(client, seeded):
    r = client.get(
        f"/tetkikler/{seeded['tetkik_a'].id}",
        headers=auth_header(seeded["hasta_a"]),
    )
    assert r.status_code == 200


def test_temizlik_baska_gorev_guncelle_403(client, seeded):
    r = client.patch(
        f"/temizlik-gorevleri/{seeded['gorev_b'].id}",
        json={"durum": "TAMAMLANDI"},
        headers=auth_header(seeded["temizlik_a"]),
    )
    assert r.status_code == 403


def test_temizlik_kendi_gorev_guncelle_200(client, seeded):
    r = client.patch(
        f"/temizlik-gorevleri/{seeded['gorev_a'].id}",
        json={"durum": "TAMAMLANDI"},
        headers=auth_header(seeded["temizlik_a"]),
    )
    assert r.status_code == 200
    assert r.json()["durum"] == "TAMAMLANDI"


def test_hemsire_farkli_departman_randevu_403(client, seeded):
    r = client.get(
        f"/randevular/{seeded['randevu_b'].id}",
        headers=auth_header(seeded["hemsire"]),
    )
    assert r.status_code == 403


def test_hemsire_kendi_departman_randevu_200(client, seeded):
    r = client.get(
        f"/randevular/{seeded['randevu_a'].id}",
        headers=auth_header(seeded["hemsire"]),
    )
    assert r.status_code == 200


def test_muayene_list_doktor_only_own(client, seeded, session):
    from app.features.muayeneler.models import MuayeneKaydi

    m_a = MuayeneKaydi(
        randevu_id=seeded["randevu_a"].id, tani="A", tedavi_plani="T", receteler=None
    )
    m_b = MuayeneKaydi(
        randevu_id=seeded["randevu_b"].id, tani="B", tedavi_plani="T", receteler=None
    )
    session.add_all([m_a, m_b])
    session.commit()

    r = client.get("/muayeneler/", headers=auth_header(seeded["doktor_a"]))
    assert r.status_code == 200
    ids = {row["randevu_id"] for row in r.json()}
    assert seeded["randevu_a"].id in ids
    assert seeded["randevu_b"].id not in ids


def test_muayene_list_hemsire_departman(client, seeded, session):
    from app.features.muayeneler.models import MuayeneKaydi

    m_a = MuayeneKaydi(
        randevu_id=seeded["randevu_a"].id, tani="A", tedavi_plani="T", receteler=None
    )
    m_b = MuayeneKaydi(
        randevu_id=seeded["randevu_b"].id, tani="B", tedavi_plani="T", receteler=None
    )
    session.add_all([m_a, m_b])
    session.commit()

    r = client.get("/muayeneler/", headers=auth_header(seeded["hemsire"]))
    assert r.status_code == 200
    ids = {row["randevu_id"] for row in r.json()}
    assert seeded["randevu_a"].id in ids
    assert seeded["randevu_b"].id not in ids


def test_rbac_roller_admin_200(client, seeded):
    r = client.get("/rbac/roller", headers=auth_header(seeded["admin"]))
    assert r.status_code == 200
    assert any(x["kod"] == "DOKTOR" for x in r.json())


def test_rbac_put_izinler_405(client, seeded):
    r = client.put(
        "/rbac/roller/DOKTOR/izinler",
        json={"izin_kodlari": ["randevu:goruntule"]},
        headers=auth_header(seeded["admin"]),
    )
    assert r.status_code == 405


def test_auth_register_hasta(client):
    r = client.post(
        "/auth/register",
        json={
            "tc_kimlik_no": "88888888881",
            "ad": "Yeni",
            "soyad": "Hasta",
            "email": "yeni.hasta@example.com",
            "sifre": "Test1234!",
        },
    )
    assert r.status_code == 201
    assert r.json()["tc_kimlik_no"] == "88888888881"


def test_login_returns_permissions(client, session):
    from app.core.security import hash_password
    from app.features.kullanicilar.models import Kullanici

    user = Kullanici(
        tc_kimlik_no="90000000999",
        ad="Perm",
        soyad="Test",
        email="perm@example.com",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.DOKTOR,
        aktif_mi=True,
    )
    session.add(user)
    session.commit()
    r = client.post(
        "/auth/login", json={"email": "perm@example.com", "sifre": "Test1234!"}
    )
    assert r.status_code == 200
    assert "randevu:goruntule" in r.json()["permissions"]


# --- Rol bazlı yetkili/yetkisiz (eksik roller) ---

def test_mudur_personel_liste_200(client, session, seeded):
    from app.core.security import hash_password
    from app.features.kullanicilar.models import Kullanici

    mudur = Kullanici(
        tc_kimlik_no="90000000801",
        ad="Mudur",
        soyad="Test",
        email="mudur-rbac@t.test",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.MUDUR,
        aktif_mi=True,
    )
    session.add(mudur)
    session.commit()
    session.refresh(mudur)
    r = client.get("/personel/", headers=auth_header(mudur))
    assert r.status_code == 200


def test_mudur_kullanici_create_403(client, session):
    from app.core.security import hash_password
    from app.features.kullanicilar.models import Kullanici

    mudur = Kullanici(
        tc_kimlik_no="90000000802",
        ad="Mudur",
        soyad="Deny",
        email="mudur-deny@t.test",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.MUDUR,
        aktif_mi=True,
    )
    session.add(mudur)
    session.commit()
    session.refresh(mudur)
    r = client.post(
        "/kullanicilar/",
        headers=auth_header(mudur),
        json={
            "tc_kimlik_no": "90000000803",
            "ad": "X",
            "soyad": "Y",
            "email": "x@t.test",
            "sifre": "Test1234!",
            "rol": "HASTA",
        },
    )
    assert r.status_code == 403


def test_ebe_randevu_liste_200(client, session, seeded):
    from app.core.security import hash_password
    from app.features.kullanicilar.models import Kullanici
    from app.features.personel.models import Personel

    ebe_u = Kullanici(
        tc_kimlik_no="90000000804",
        ad="Ebe",
        soyad="Test",
        email="ebe@t.test",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.EBE,
        aktif_mi=True,
    )
    session.add(ebe_u)
    session.commit()
    session.refresh(ebe_u)
    session.add(
        Personel(
            kullanici_id=ebe_u.id,
            sicil_no="EBE-A",
            departman_id=seeded["dep_a"].id,
            unvan="Ebe",
        )
    )
    session.commit()
    r = client.get("/randevular/", headers=auth_header(ebe_u))
    assert r.status_code == 200


def test_ebe_temizlik_ata_403(client, session, seeded):
    from app.core.security import hash_password
    from app.features.kullanicilar.models import Kullanici

    ebe_u = Kullanici(
        tc_kimlik_no="90000000805",
        ad="Ebe",
        soyad="Deny",
        email="ebe-deny@t.test",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.EBE,
        aktif_mi=True,
    )
    session.add(ebe_u)
    session.commit()
    session.refresh(ebe_u)
    r = client.post(
        "/temizlik-gorevleri/",
        json={
            "personel_id": seeded["gorev_a"].personel_id,
            "oda_bolum": "999",
            "gorev_tarihi": "2030-02-01",
        },
        headers=auth_header(ebe_u),
    )
    assert r.status_code == 403


def test_guvenlik_sikayet_gonder_matrisi():
    assert kapsam_getir(Rol.GUVENLIK, "sikayet_oneri:gonder") != Kapsam.YOK
    assert kapsam_getir(Rol.GUVENLIK, "randevu:olustur") == Kapsam.YOK


def test_idari_personel_izin_matrisi():
    assert kapsam_getir(Rol.IDARI_PERSONEL, "sikayet_oneri:gonder") != Kapsam.YOK
    assert kapsam_getir(Rol.IDARI_PERSONEL, "kullanici:sil") == Kapsam.YOK


def test_doktor_a_doktor_b_kaynak_403(client, seeded):
    """DOKTOR A → DOKTOR B kaynağı — sahiplik (Faz 3 tamamlandı)."""
    r = client.get(
        f"/randevular/{seeded['randevu_b'].id}",
        headers=auth_header(seeded["doktor_a"]),
    )
    assert r.status_code == 403


def test_doktor_hasta_liste_genel_403(client, seeded):
    r = client.get("/hastalar/", headers=auth_header(seeded["doktor_a"]))
    assert r.status_code == 403


def test_doktor_benim_hastalar_scoped(client, seeded):
    r = client.get("/hastalar/benim", headers=auth_header(seeded["doktor_a"]))
    assert r.status_code == 200
    ids = {h["id"] for h in r.json()}
    assert seeded["hasta_a_entity"].id in ids
    assert seeded["hasta_b_entity"].id not in ids


def test_doktor_baska_hasta_detay_403(client, seeded):
    r = client.get(
        f"/hastalar/{seeded['hasta_b_entity'].id}",
        headers=auth_header(seeded["doktor_a"]),
    )
    assert r.status_code == 403


def test_doktor_kendi_hasta_detay_200(client, seeded):
    r = client.get(
        f"/hastalar/{seeded['hasta_a_entity'].id}",
        headers=auth_header(seeded["doktor_a"]),
    )
    assert r.status_code == 200


def test_doktor_klinik_onay_kendi_kapsam(client, seeded):
    body = {
        "tur": "RECETE",
        "hasta_id": seeded["hasta_a_entity"].id,
        "icerik": "Parasetamol 500mg",
    }
    c = client.post("/klinik-onay/", json=body, headers=auth_header(seeded["doktor_a"]))
    assert c.status_code == 201
    r = client.get("/klinik-onay/", headers=auth_header(seeded["doktor_a"]))
    assert r.status_code == 200
    assert all(x["olusturan_id"] == seeded["doktor_a"].id for x in r.json())


def test_doktor_yeni_izinler_matrisi():
    assert kapsam_getir(Rol.DOKTOR, "muayene:guncelle") == Kapsam.KENDI_KAYDIM
    assert kapsam_getir(Rol.DOKTOR, "hasta:goruntule") == Kapsam.KENDI_KAYDIM
    assert kapsam_getir(Rol.DOKTOR, "klinik_onay:olustur") == Kapsam.KENDI_KAYDIM
    assert kapsam_getir(Rol.DOKTOR, "konsultasyon:olustur") == Kapsam.KENDI_KAYDIM
    assert kapsam_getir(Rol.DOKTOR, "saglik_kurulu:goruntule") == Kapsam.KENDI_KAYDIM
