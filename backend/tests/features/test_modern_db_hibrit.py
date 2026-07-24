"""Modern hibrit DB — birim testleri (SQLite uyumlu kısımlar)."""

from datetime import date, datetime, timezone

import pytest
from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.audit import denetim_kaydi_yaz
from app.core.audit_mask import mask_dict, mask_tc
from app.core.enums import Rol
from app.core.security import hash_password
from app.features.auth.models import DenetimKaydi
from app.features.kullanicilar.models import Kullanici
from app.core.timezone import as_utc
from app.features.mhrs.router import _payload_hash
from app.features.yatis.models import Servis, Yatak
from app.features.yatis.service import _yatak_bosalt, _yatak_dolu_yap
from tests.conftest import auth_header


def test_mask_narrow_diff():
    full = mask_dict(
        {"tc_kimlik_no": "12345678901", "kan_grubu": "A+", "cinsiyet": "K", "extra": 1}
    )
    assert "extra" in full
    narrow = mask_dict(
        {"tc_kimlik_no": "12345678901", "kan_grubu": "A+", "cinsiyet": "K", "extra": 1},
        narrow=True,
    )
    assert "extra" not in narrow
    assert narrow.get("kan_grubu") == "A+"


def test_mask_dict_p95_budget():
    """Maskeleme maliyeti düşük kalmalı (trigger p95 için alt sınır)."""
    import time

    payload = {
        "tc_kimlik_no": "12345678901",
        "adres": "x" * 200,
        "telefon": "05551234567",
        "kan_grubu": "0+",
        "cinsiyet": "E",
        "dogum_tarihi": "1990-01-01",
    }
    t0 = time.perf_counter()
    for _ in range(5000):
        mask_dict(payload)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    # 5000 mask < 200ms (ortam gevşek eşiği)
    assert elapsed_ms < 200, f"mask_dict yavaş: {elapsed_ms:.1f}ms"


def test_as_utc_naive_istanbul():
    naive = datetime(2026, 7, 24, 10, 0, 0)
    utc = as_utc(naive)
    assert utc.tzinfo is not None
    assert utc.hour == 7


def test_to_istanbul_roundtrip():
    from app.core.timezone import to_istanbul
    from datetime import timezone

    utc = datetime(2026, 7, 25, 6, 0, 0, tzinfo=timezone.utc)
    ist = to_istanbul(utc)
    assert ist.hour == 9
    assert ist.tzinfo is not None


def test_randevu_cakisma_409(client, seeded):
    admin = seeded["admin"]
    headers = auth_header(admin)
    ts = datetime(2026, 8, 1, 10, 0, 0, tzinfo=timezone.utc)
    body = {
        "hasta_id": seeded["hasta_a_entity"].id,
        "doktor_id": seeded["doktor_a_entity"].id,
        "departman_id": seeded["dep_a"].id,
        "tarih_saat": ts.isoformat(),
        "notlar": "t1",
    }
    r1 = client.post("/randevular/", json=body, headers=headers)
    assert r1.status_code in (200, 201), r1.text
    r2 = client.post("/randevular/", json=body, headers=headers)
    assert r2.status_code == 409, r2.text


def test_mhrs_idempotency(client, seeded):
    headers = auth_header(seeded["bashekim"])
    body = {
        "departman_id": seeded["dep_a"].id,
        "doktor_id": None,
        "tarih": "2026-09-01",
        "slot_sayisi": 10,
        "idempotency_key": "test-key-1",
    }
    r1 = client.post("/mhrs/", json=body, headers=headers)
    assert r1.status_code in (200, 201), r1.text
    id1 = r1.json()["id"]
    r2 = client.post("/mhrs/", json=body, headers=headers)
    assert r2.status_code in (200, 201)
    assert r2.json()["id"] == id1

    body2 = {**body, "slot_sayisi": 20}
    r3 = client.post("/mhrs/", json=body2, headers=headers)
    assert r3.status_code == 422, r3.text


def test_payload_hash_stable():
    h1 = _payload_hash(1, None, date(2026, 1, 1), 16)
    h2 = _payload_hash(1, None, date(2026, 1, 1), 16)
    h3 = _payload_hash(1, None, date(2026, 1, 1), 17)
    assert h1 == h2
    assert h1 != h3


def test_yatak_atomic_occupy(session: Session):
    servis = Servis(ad="Test Servis", kod="TS")
    session.add(servis)
    session.commit()
    session.refresh(servis)
    yatak = Yatak(servis_id=servis.id, oda_no="1", yatak_no="A", dolu_mu=False)
    session.add(yatak)
    session.commit()
    session.refresh(yatak)

    _yatak_dolu_yap(session, yatak.id)
    session.commit()
    with pytest.raises(HTTPException) as ei:
        _yatak_dolu_yap(session, yatak.id)
    assert ei.value.status_code == 409
    _yatak_bosalt(session, yatak.id)
    session.commit()


def test_denetim_list_no_detay(client, seeded, session: Session):
    admin = seeded["admin"]
    denetim_kaydi_yaz(
        session,
        aksiyon="TEST_MASK",
        actor_id=admin.id,
        kaynak="hastalar",
        kaynak_id=1,
        detay={"tc_kimlik_no": "12345678901", "adres": "gizli"},
    )
    headers = auth_header(admin)
    r = client.get("/denetim/", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data
    assert "detay" not in data[0]
    row = session.exec(
        select(DenetimKaydi).where(DenetimKaydi.aksiyon == "TEST_MASK")
    ).first()
    assert row is not None
    assert row.detay["tc_kimlik_no"] == "***8901"
    assert row.detay["adres"] == "[masked]"


def test_denetim_detay_admin_only(client, seeded, session: Session):
    admin = seeded["admin"]
    kayit = denetim_kaydi_yaz(
        session,
        aksiyon="TEST_DETAY",
        actor_id=admin.id,
        kaynak="hastalar",
        kaynak_id=2,
        detay={"kan_grubu": "A+"},
    )
    r_ok = client.get(
        f"/denetim/{kayit.id}/detay", headers=auth_header(admin)
    )
    assert r_ok.status_code == 200
    assert r_ok.json().get("detay") is not None

    r_deny = client.get(
        f"/denetim/{kayit.id}/detay", headers=auth_header(seeded["bashekim"])
    )
    assert r_deny.status_code == 403


def test_dashboard_doktor_ozet(client, seeded):
    headers = auth_header(seeded["doktor_a"])
    r = client.get("/dashboard/doktor/ozet", headers=headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "bugun_randevu" in body
