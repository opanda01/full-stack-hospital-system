"""MPI mükerrer aday / merge iskeleti testleri."""

from app.core.tc_kimlik import tc_ilk_dokuz_haneden
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.core.enums import Rol
from app.core.security import hash_password
from tests.conftest import auth_header


def test_mukerrer_aday_ve_merge_onay(client, session, seeded):
    tc = tc_ilk_dokuz_haneden("930000001")
    # İkinci hasta aynı TC ile (doğrudan model — API ikinci create'i reddeder)
    u2 = Kullanici(
        tc_kimlik_no=tc + "x",  # unique constraint kullanıcıda — farklı TC string
        ad="Muk",
        soyad="Errer",
        email="mukerrer@t.test",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.HASTA,
        aktif_mi=True,
    )
    # Aynı TC iki Hasta kaydı senaryosu: kullanıcı TC unique olduğu için
    # aday sorgusu aynı TC hash/plain ile eşleşenleri bulur — seeded hasta + yeni.
    # Seeded hasta_a TC'sini bilinen geçerli TC ile güncelle.
    ha = seeded["hasta_a_entity"]
    ha.tc_kimlik_no = tc
    ku = session.get(Kullanici, ha.kullanici_id)
    assert ku is not None
    ku.tc_kimlik_no = tc
    session.add(ha)
    session.add(ku)

    u2.tc_kimlik_no = tc_ilk_dokuz_haneden("930000002")
    session.add(u2)
    session.flush()
    hb2 = Hasta(kullanici_id=u2.id, tc_kimlik_no=tc)  # aynı TC, farklı kullanıcı
    session.add(hb2)
    session.commit()
    session.refresh(ha)
    session.refresh(hb2)

    r = client.get(
        "/hastalar/mukerrer-adaylar",
        params={"tc": tc},
        headers=auth_header(seeded["admin"]),
    )
    assert r.status_code == 200
    ids = {item["id"] for item in r.json()}
    assert str(ha.public_id) in ids
    assert str(hb2.public_id) in ids

    r2 = client.post(
        "/hastalar/mukerrer-istekleri",
        headers=auth_header(seeded["admin"]),
        json={
            "kaynak_hasta_id": str(hb2.public_id),
            "hedef_hasta_id": str(ha.public_id),
            "gerekce": "Aynı TC ile çift kayıt tespit edildi",
        },
    )
    assert r2.status_code == 201, r2.text
    istek_id = r2.json()["id"]

    r3 = client.post(
        f"/hastalar/mukerrer-istekleri/{istek_id}/onayla",
        headers=auth_header(seeded["admin"]),
    )
    assert r3.status_code == 200
    assert r3.json()["durum"] == "ONAYLANDI"

    session.refresh(hb2)
    assert hb2.merged_into_hasta_id == ha.id
