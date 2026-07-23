"""P0 — Yatış API: kapsam, vital, laborant 403."""

from datetime import datetime, timezone

from sqlmodel import Session, select

from app.core.enums import KlinikDurum, YatisIslemTipi
from app.features.personel.models import Personel
from app.core.security import create_access_token
from app.features.kullanicilar.models import Kullanici
from app.features.yatis.models import Servis, Yatak, YatisKaydi


def auth_header(user: Kullanici) -> dict[str, str]:
    token = create_access_token(user.id, user.rol)
    return {"Authorization": f"Bearer {token}"}


def _seed_yatis(session: Session, seeded: dict) -> YatisKaydi:
    hemsire_personel = session.exec(
        select(Personel).where(Personel.kullanici_id == seeded["hemsire"].id)
    ).one()
    servis = Servis(
        ad="Kardiyoloji Servis",
        kod="KARD-S1",
        kat_no=3,
        departman_id=seeded["dep_a"].id,
    )
    session.add(servis)
    session.commit()
    session.refresh(servis)

    yatak = Yatak(
        servis_id=servis.id,
        oda_no="301",
        yatak_no="A",
        dolu_mu=True,
    )
    session.add(yatak)
    session.commit()
    session.refresh(yatak)

    yatis = YatisKaydi(
        hasta_id=seeded["hasta_a_entity"].id,
        servis_id=servis.id,
        yatak_id=yatak.id,
        protokol_no="PR-TEST-001",
        yatis_tarihi=datetime.now(timezone.utc),
        klinik_durum=KlinikDurum.NORMAL,
        sorumlu_doktor_id=seeded["doktor_a_entity"].id,
        sorumlu_hemsire_id=hemsire_personel.id,
        aktif_mi=True,
    )
    session.add(yatis)
    session.commit()
    session.refresh(yatis)
    return yatis


def test_laborant_yatis_kayitlar_403(client, seeded):
    r = client.get("/yatis/kayitlar", headers=auth_header(seeded["laborant"]))
    assert r.status_code == 403


def test_hemsire_yatis_liste_kapsam_benim(client, session, seeded):
    yatis = _seed_yatis(session, seeded)
    r = client.get(
        "/yatis/kayitlar",
        params={"kapsam": "benim"},
        headers=auth_header(seeded["hemsire"]),
    )
    assert r.status_code == 200
    ids = [row["id"] for row in r.json()]
    assert yatis.id in ids


def test_hemsire_vital_ekle(client, session, seeded):
    yatis = _seed_yatis(session, seeded)
    r = client.post(
        f"/yatis/kayitlar/{yatis.id}/vitaller",
        headers=auth_header(seeded["hemsire"]),
        json={
            "nabiz": 88,
            "ates": 36.7,
            "spo2": 98,
            "tansiyon_sistolik": 120,
            "tansiyon_diastolik": 80,
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["nabiz"] == 88
    assert body["yatis_id"] == yatis.id

    r = client.get(
        f"/yatis/kayitlar/{yatis.id}/vitaller",
        headers=auth_header(seeded["hemsire"]),
    )
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_hemsire_kontrol_islem_log(client, session, seeded):
    yatis = _seed_yatis(session, seeded)
    r = client.post(
        f"/yatis/kayitlar/{yatis.id}/islemler",
        headers=auth_header(seeded["hemsire"]),
        json={"tip": YatisIslemTipi.KONTROL_TOGGLE.value},
    )
    assert r.status_code == 200
    assert r.json()["kontrol_edildi_mi"] is True

    r = client.get(
        f"/yatis/kayitlar/{yatis.id}/islem-loglari",
        headers=auth_header(seeded["hemsire"]),
    )
    assert r.status_code == 200
    assert any(log["islem_tipi"] == YatisIslemTipi.KONTROL_TOGGLE.value for log in r.json())
