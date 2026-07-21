"""Personel import + RBAC testleri."""

from io import BytesIO

from sqlmodel import select

from app.core.enums import ImportDurum, Rol
from app.core.security import create_access_token, hash_password
from app.features.auth.models import PersonelImportIsi
from app.features.hastalar.models import Hasta
from app.features.kullanicilar.models import Kullanici
from app.features.personel import import_service
from app.features.personel.models import Personel


def _auth(user: Kullanici) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.rol)}"}


def _admin(session) -> Kullanici:
    u = Kullanici(
        tc_kimlik_no="92000000001",
        ad="Admin",
        soyad="Import",
        email="admin-import@example.com",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.ADMIN,
        aktif_mi=True,
        kvkk_onaylandi_mi=True,
    )
    session.add(u)
    session.commit()
    session.refresh(u)
    return u


def test_import_rbac_forbidden(client, session):
    hemsire = Kullanici(
        tc_kimlik_no="92000000002",
        ad="H",
        soyad="E",
        email="h-imp@example.com",
        sifre_hash=hash_password("Test1234!"),
        rol=Rol.HEMSIRE,
        aktif_mi=True,
    )
    session.add(hemsire)
    session.commit()
    session.refresh(hemsire)

    csv_data = b"Ad,Soyad,TC Kimlik No,Sicil No,Rol,Departman,Telefon,Email\n"
    r = client.post(
        "/personel/import",
        headers=_auth(hemsire),
        files={"file": ("p.csv", BytesIO(csv_data), "text/csv")},
    )
    assert r.status_code == 403


def test_import_job_success_and_dual_profile(client, session):
    admin = _admin(session)

    # Önce hasta olarak var olan TC
    hasta_u = Kullanici(
        tc_kimlik_no="92000000003",
        ad="Ayse",
        soyad="Yilmaz",
        email="ayse-hasta@example.com",
        sifre_hash=None,
        rol=Rol.HASTA,
        aktif_mi=True,
        telefon="05550001122",
    )
    session.add(hasta_u)
    session.flush()
    session.add(Hasta(kullanici_id=hasta_u.id, tc_kimlik_no="92000000003"))
    session.commit()

    rows = [
        {
            "ad": "Ayse",
            "soyad": "Yilmaz",
            "tc_kimlik_no": "92000000003",
            "sicil_no": "H-300",
            "rol": "HEMSIRE",
            "telefon": "05550001122",
            "email": "ayse-hasta@example.com",
        },
        {
            "ad": "Yeni",
            "soyad": "Personel",
            "tc_kimlik_no": "92000000004",
            "sicil_no": "H-301",
            "rol": "EBE",
            "email": "yeni-p@example.com",
            "telefon": "05550003344",
        },
        {
            # duplicate sicil on second pass — fail row when same sicil
            "ad": "Dup",
            "soyad": "Sicil",
            "tc_kimlik_no": "92000000005",
            "sicil_no": "H-300",
            "rol": "LABORANT",
            "email": "dup@example.com",
        },
    ]

    isi = import_service.create_import_isi(
        session, actor_id=admin.id, rows=rows
    )
    assert isi.actor_id == admin.id
    import_service.run_import_job(session, isi.id, rows)

    isi = session.get(PersonelImportIsi, isi.id)
    assert isi is not None
    assert isi.durum == ImportDurum.TAMAMLANDI
    assert isi.basarili == 2
    assert isi.basarisiz == 1

    session.refresh(hasta_u)
    assert hasta_u.rol == Rol.HEMSIRE
    assert session.exec(
        select(Personel).where(Personel.kullanici_id == hasta_u.id)
    ).first()

    # API progress
    r = client.get(f"/personel/import/{isi.id}", headers=_auth(admin))
    assert r.status_code == 200
    assert r.json()["basarili"] == 2


def test_import_endpoint_with_mocked_celery(client, session, monkeypatch):
    admin = _admin(session)

    def fake_delay(isi_id, rows):
        import_service.run_import_job(session, isi_id, rows)

        class R:
            id = "eager-task-id"

        return R()

    monkeypatch.setattr(
        "app.features.personel.tasks.personel_import_isle.delay",
        fake_delay,
    )

    csv_body = (
        "Ad,Soyad,TC Kimlik No,Sicil No,Rol,Email,Telefon\n"
        "Fatma,Demir,92000000006,H-400,GUVENLIK,fatma@example.com,05556667788\n"
    ).encode("utf-8")

    r = client.post(
        "/personel/import",
        headers=_auth(admin),
        files={"file": ("staff.csv", BytesIO(csv_body), "text/csv")},
    )
    assert r.status_code == 202
    data = r.json()
    assert data["toplam"] == 1
    assert data["celery_task_id"] == "eager-task-id"

    isi = session.get(PersonelImportIsi, data["isi_id"])
    assert isi is not None
    assert isi.basarili == 1
    assert isi.actor_id == admin.id
