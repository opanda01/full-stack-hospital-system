"""P0/P1 — Epikriz: hemşire taslak, doktor onay."""

from datetime import datetime, timezone

from sqlmodel import Session, select

from app.core.enums import KlinikDurum
from app.core.security import create_access_token
from app.features.kullanicilar.models import Kullanici
from app.features.personel.models import Personel
from app.features.yatis.models import Servis, Yatak, YatisKaydi


def auth_header(user: Kullanici) -> dict[str, str]:
    token = create_access_token(user.id, user.rol)
    return {"Authorization": f"Bearer {token}"}


def _seed_yatis(session: Session, seeded: dict) -> YatisKaydi:
    hemsire_personel = session.exec(
        select(Personel).where(Personel.kullanici_id == seeded["hemsire"].id)
    ).one()
    servis = Servis(
        ad="Epikriz Servis",
        kod="EPI-S1",
        kat_no=2,
        departman_id=seeded["dep_a"].id,
    )
    session.add(servis)
    session.commit()
    session.refresh(servis)
    yatak = Yatak(servis_id=servis.id, oda_no="201", yatak_no="B", dolu_mu=True)
    session.add(yatak)
    session.commit()
    session.refresh(yatak)
    yatis = YatisKaydi(
        hasta_id=seeded["hasta_a_entity"].id,
        servis_id=servis.id,
        yatak_id=yatak.id,
        protokol_no="PR-EPI-001",
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


def test_hemsire_epikriz_taslak_doktor_onay(client, session, seeded):
    yatis = _seed_yatis(session, seeded)

    r = client.post(
        "/epikriz/",
        headers=auth_header(seeded["hemsire"]),
        json={
            "yatis_id": yatis.id,
            "sikayet_oyku": "Göğüs ağrısı",
            "tani": "Stabil anjina",
            "tedavi_ozeti": "Medikal tedavi",
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["durum"] == "TASLAK"
    assert body["yatis_id"] == yatis.id
    assert body["hasta_id"] == seeded["hasta_a_entity"].id
    epikriz_id = body["id"]

    r = client.post(
        f"/epikriz/{epikriz_id}/onayla",
        headers=auth_header(seeded["doktor_a"]),
    )
    assert r.status_code == 200
    onay = r.json()
    assert onay["durum"] == "ONAYLANDI"
    assert onay["onaylayan_doktor_id"] == seeded["doktor_a_entity"].id


def test_onayli_epikriz_guncellenemez(client, session, seeded):
    yatis = _seed_yatis(session, seeded)
    r = client.post(
        "/epikriz/",
        headers=auth_header(seeded["hemsire"]),
        json={"yatis_id": yatis.id, "tani": "Taslak"},
    )
    epikriz_id = r.json()["id"]
    client.post(
        f"/epikriz/{epikriz_id}/onayla",
        headers=auth_header(seeded["doktor_a"]),
    )
    r = client.patch(
        f"/epikriz/{epikriz_id}",
        headers=auth_header(seeded["hemsire"]),
        json={"tani": "Değişiklik"},
    )
    assert r.status_code == 400


def test_laborant_epikriz_403(client, session, seeded):
    yatis = _seed_yatis(session, seeded)
    r = client.post(
        "/epikriz/",
        headers=auth_header(seeded["laborant"]),
        json={"yatis_id": yatis.id, "tani": "X"},
    )
    assert r.status_code == 403
