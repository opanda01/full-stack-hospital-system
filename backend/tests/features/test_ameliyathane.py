"""Ameliyathane — çakışma kontrolü birim testleri."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from sqlmodel import Session

from app.core.enums import AmeliyathaneDurumu, AmeliyatPlaniDurumu
from app.features.ameliyathane.models import Ameliyathane, AmeliyatPlani
from app.features.ameliyathane.schemas import AmeliyatPlaniOlustur
from app.features.ameliyathane import service as ameliyat_service
from app.core.permissions import Kapsam
from app.core.public_id import hasta_public_id_from_pk


def _ameliyathane(session: Session, oda: str = "T-1") -> Ameliyathane:
    a = Ameliyathane(
        ad=f"Test {oda}",
        oda_no=oda,
        durum=AmeliyathaneDurumu.MUSAIT,
    )
    session.add(a)
    session.commit()
    session.refresh(a)
    return a


def _plan_body(
    session: Session,
    seeded: dict,
    *,
    ameliyathane_id: int,
    baslangic: datetime,
    sure_dk: int = 60,
    cerrah_personel_id: int | None = None,
) -> AmeliyatPlaniOlustur:
    pa = seeded["doktor_a_entity"]
    cerrah = cerrah_personel_id or pa.personel_id
    hasta_uuid = hasta_public_id_from_pk(session, seeded["hasta_a_entity"].id)
    return AmeliyatPlaniOlustur(
        hasta_id=hasta_uuid,
        ameliyathane_id=ameliyathane_id,
        sorumlu_cerrah_id=cerrah,
        planlanan_baslangic=baslangic,
        planlanan_sure_dk=sure_dk,
        ameliyat_adi="Test ameliyat",
    )


def test_ameliyathane_oda_cakismasi(session: Session, seeded):
    a1 = _ameliyathane(session, "C-A")
    a2 = _ameliyathane(session, "C-B")
    bas = datetime(2026, 8, 10, 10, 0, tzinfo=timezone.utc)
    admin = seeded["admin"]

    ameliyat_service.ameliyat_planla(
        session,
        _plan_body(session, seeded, ameliyathane_id=a1.id, baslangic=bas),
        kapsam=Kapsam.GLOBAL,
        current_user=admin,
    )

    with pytest.raises(HTTPException) as exc:
        ameliyat_service.ameliyat_planla(
            session,
            _plan_body(
                session,
                seeded,
                ameliyathane_id=a1.id,
                baslangic=bas + timedelta(minutes=30),
            ),
            kapsam=Kapsam.GLOBAL,
            current_user=admin,
        )
    assert exc.value.status_code == 409

    from app.features.personel.models import Personel
    from sqlmodel import select

    cerrah_b = session.exec(
        select(Personel).where(Personel.kullanici_id == seeded["doktor_b"].id)
    ).one().id

    ameliyat_service.ameliyat_planla(
        session,
        _plan_body(
            session,
            seeded,
            ameliyathane_id=a2.id,
            baslangic=bas + timedelta(minutes=30),
            cerrah_personel_id=cerrah_b,
        ),
        kapsam=Kapsam.GLOBAL,
        current_user=admin,
    )


def test_cerrah_cakismasi_farkli_oda(session: Session, seeded):
    a1 = _ameliyathane(session, "S-A")
    a2 = _ameliyathane(session, "S-B")
    bas = datetime(2026, 8, 11, 14, 0, tzinfo=timezone.utc)
    admin = seeded["admin"]

    from app.features.personel.models import Personel
    from sqlmodel import select

    cerrah_id = session.exec(
        select(Personel).where(
            Personel.kullanici_id == seeded["doktor_a"].id
        )
    ).one().id

    ameliyat_service.ameliyat_planla(
        session,
        _plan_body(session, seeded, ameliyathane_id=a1.id, baslangic=bas),
        kapsam=Kapsam.GLOBAL,
        current_user=admin,
    )

    with pytest.raises(HTTPException) as exc:
        ameliyat_service.ameliyat_planla(
            session,
            _plan_body(
                session,
                seeded,
                ameliyathane_id=a2.id,
                baslangic=bas + timedelta(minutes=15),
                cerrah_personel_id=cerrah_id,
            ),
            kapsam=Kapsam.GLOBAL,
            current_user=admin,
        )
    assert exc.value.status_code == 409
    assert "cerrah" in exc.value.detail.lower()


def test_iptal_plan_cakisma_sayilmaz(session: Session, seeded):
    a1 = _ameliyathane(session, "I-A")
    bas = datetime(2026, 8, 12, 8, 0, tzinfo=timezone.utc)
    admin = seeded["admin"]

    body = _plan_body(session, seeded, ameliyathane_id=a1.id, baslangic=bas)
    plan = ameliyat_service.ameliyat_planla(
        session, body, kapsam=Kapsam.GLOBAL, current_user=admin
    )
    row = session.get(AmeliyatPlani, plan.id)
    assert row is not None
    row.durum = AmeliyatPlaniDurumu.IPTAL
    session.add(row)
    session.commit()

    ameliyat_service.ameliyat_planla(
        session,
        _plan_body(session, seeded, ameliyathane_id=a1.id, baslangic=bas),
        kapsam=Kapsam.GLOBAL,
        current_user=admin,
    )
