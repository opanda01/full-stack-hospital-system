"""P1 — İlaç talep oluşturma ve durum zinciri."""

from datetime import datetime, timezone

from sqlmodel import Session, select

from app.core.enums import IlacTalepDurumu, KlinikDurum
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
        ad="İlaç Servis",
        kod="ILAC-S1",
        kat_no=1,
        departman_id=seeded["dep_a"].id,
    )
    session.add(servis)
    session.commit()
    session.refresh(servis)
    yatak = Yatak(servis_id=servis.id, oda_no="101", yatak_no="C", dolu_mu=True)
    session.add(yatak)
    session.commit()
    session.refresh(yatak)
    yatis = YatisKaydi(
        hasta_id=seeded["hasta_a_entity"].id,
        servis_id=servis.id,
        yatak_id=yatak.id,
        protokol_no="PR-ILAC-001",
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


def test_ilac_talep_olustur_ve_durum_zinciri(client, session, seeded):
    yatis = _seed_yatis(session, seeded)

    r = client.post(
        "/ilac-talepleri/",
        headers=auth_header(seeded["hemsire"]),
        json={
            "yatis_id": yatis.id,
            "gonder": True,
            "acil_mi": True,
            "kalemler": [
                {
                    "urun_kodu": "PARA500",
                    "urun_adi": "Parasetamol 500mg",
                    "istenen_miktar": 10,
                    "kullanim_sekli": "ORAL",
                    "doz": "1x3",
                }
            ],
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["durum"] == IlacTalepDurumu.ONAY_BEKLIYOR.value
    assert body["acil_mi"] is True
    assert len(body["kalemler"]) == 1
    talep_id = body["id"]

    r = client.patch(
        f"/ilac-talepleri/{talep_id}/durum",
        headers=auth_header(seeded["hemsire"]),
        json={"durum": IlacTalepDurumu.ONAYLANDI.value},
    )
    assert r.status_code == 200
    assert r.json()["durum"] == IlacTalepDurumu.ONAYLANDI.value

    r = client.patch(
        f"/ilac-talepleri/{talep_id}/durum",
        headers=auth_header(seeded["hemsire"]),
        json={"durum": IlacTalepDurumu.VERILDI.value},
    )
    assert r.status_code == 200
    assert r.json()["durum"] == IlacTalepDurumu.VERILDI.value
    assert r.json()["kalemler"][0]["verilen_miktar"] == 10

    r = client.get(
        f"/ilac-talepleri/hasta/{seeded['hasta_a_entity'].id}/verilen",
        headers=auth_header(seeded["hemsire"]),
    )
    assert r.status_code == 200
    assert any(v["talep_id"] == talep_id for v in r.json())


def test_laborant_ilac_talep_403(client, session, seeded):
    yatis = _seed_yatis(session, seeded)
    r = client.post(
        "/ilac-talepleri/",
        headers=auth_header(seeded["laborant"]),
        json={
            "yatis_id": yatis.id,
            "kalemler": [
                {
                    "urun_kodu": "X",
                    "urun_adi": "X",
                    "istenen_miktar": 1,
                }
            ],
        },
    )
    assert r.status_code == 403
