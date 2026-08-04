"""Faz 3 iyileştirme testleri."""

from datetime import date, timedelta

import pytest
from fastapi import HTTPException
from sqlmodel import select

from app.features.auth.models import DenetimKaydi
from app.features.nobet_cizelgesi.schemas import NobetCreate
from app.features.nobet_cizelgesi import service as nobet_service
from tests.conftest import auth_header


def test_dis_aktarim_denetim_export(client, session, seeded):
    hemsire = seeded["hemsire"]
    r = client.post(
        "/denetim/dis-aktarim",
        headers=auth_header(hemsire),
        json={
            "kaynak": "epikriz",
            "kaynak_id": "42",
            "format": "PDF",
        },
    )
    assert r.status_code == 204
    audit = session.exec(
        select(DenetimKaydi).where(DenetimKaydi.aksiyon == "KAYIT_EXPORT")
    ).first()
    assert audit is not None
    assert audit.detay.get("format") == "PDF"


def test_nobet_haftalik_limit_raises(session, seeded):
    hemsire_p = seeded["hemsire_entity"]
    dep = seeded["dep_a"]
    bas = date.today() - timedelta(days=date.today().weekday())
    for i in range(6):
        nobet_service.create_nobet(
            session,
            NobetCreate(
                personel_id=hemsire_p.id,
                departman_id=dep.id,
                tarih=bas + timedelta(days=i),
                vardiya="SABAH",
                sira=0,
            ),
        )
    with pytest.raises(HTTPException) as exc:
        nobet_service.create_nobet(
            session,
            NobetCreate(
                personel_id=hemsire_p.id,
                departman_id=dep.id,
                tarih=bas + timedelta(days=6),
                vardiya="SABAH",
                sira=0,
            ),
        )
    assert exc.value.status_code == 400
