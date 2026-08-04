"""MAR (ilac_uygulama) alerji / DDI güvenlik kapısı."""

from datetime import datetime, timezone, timedelta

from app.core.enums import AlerjiSiddet, AllerjenTipi, IlacUygulamaDurumu
from app.features.hastalar.alerji_models import HastaAlerjisi
from app.features.muayeneler.recete_models import IlacEtkenMaddesi
from tests.features.test_yatis import _seed_yatis, auth_header


def test_mar_create_hard_stop_alerji(client, session, seeded):
    yatis = _seed_yatis(session, seeded)
    hasta = seeded["hasta_a_entity"]
    session.add(
        HastaAlerjisi(
            hasta_id=hasta.id,
            allerjen_tipi=AllerjenTipi.ILAC,
            allerjen_adi="Amoksisilin",
            siddet=AlerjiSiddet.SIDDETLI,
        )
    )
    session.add(
        IlacEtkenMaddesi(
            etken_kodu="PENICILLIN",
            etken_adi="Penisilin",
            urun_adi_eslesme="amoksisilin",
        )
    )
    session.commit()

    r = client.post(
        f"/yatis/kayitlar/{yatis.id}/ilac-uygulamalari",
        headers=auth_header(seeded["hemsire"]),
        json={
            "ilac_adi": "Amoksisilin 500mg",
            "planlanan_saat": (
                datetime.now(timezone.utc) + timedelta(hours=1)
            ).isoformat(),
        },
    )
    assert r.status_code == 422
    detail = r.json().get("detail") or {}
    assert detail.get("kod") == "MAR_HARD_STOP"


def test_mar_create_ok_without_allergy(client, session, seeded):
    yatis = _seed_yatis(session, seeded)
    r = client.post(
        f"/yatis/kayitlar/{yatis.id}/ilac-uygulamalari",
        headers=auth_header(seeded["hemsire"]),
        json={
            "ilac_adi": "Parasetamol 500mg",
            "planlanan_saat": (
                datetime.now(timezone.utc) + timedelta(hours=1)
            ).isoformat(),
        },
    )
    assert r.status_code == 201
    assert r.json()["ilac_adi"] == "Parasetamol 500mg"
    assert r.json()["durum"] == IlacUygulamaDurumu.BEKLIYOR.value


def test_mar_verildi_hard_stop(client, session, seeded):
    yatis = _seed_yatis(session, seeded)
    hasta = seeded["hasta_a_entity"]
    # Önce alerjisiz oluştur
    r = client.post(
        f"/yatis/kayitlar/{yatis.id}/ilac-uygulamalari",
        headers=auth_header(seeded["hemsire"]),
        json={
            "ilac_adi": "Amoksisilin 500mg",
            "planlanan_saat": (
                datetime.now(timezone.utc) + timedelta(hours=1)
            ).isoformat(),
        },
    )
    assert r.status_code == 201
    uid = r.json()["id"]

    session.add(
        HastaAlerjisi(
            hasta_id=hasta.id,
            allerjen_tipi=AllerjenTipi.ILAC,
            allerjen_adi="Amoksisilin",
            siddet=AlerjiSiddet.ANAFILAKSI,
        )
    )
    session.commit()

    r2 = client.patch(
        f"/yatis/ilac-uygulamalari/{uid}/durum",
        headers=auth_header(seeded["hemsire"]),
        json={"durum": IlacUygulamaDurumu.VERILDI.value},
    )
    assert r2.status_code == 422
    assert (r2.json().get("detail") or {}).get("kod") == "MAR_HARD_STOP"
