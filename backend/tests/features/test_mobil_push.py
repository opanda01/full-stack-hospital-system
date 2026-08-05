"""Hasta mobil push cihaz kaydı."""

from app.core.enums import OturumTipi
from app.core.security import create_access_token
from app.features.mobil.models import HastaMobilCihaz
from sqlmodel import select


def _hasta_auth(user) -> dict[str, str]:
    token = create_access_token(user.id, user.rol, oturum_tipi=OturumTipi.HASTA)
    return {"Authorization": f"Bearer {token}"}


def test_mobil_cihaz_kayit_ve_sil(client, seeded, session):
    headers = _hasta_auth(seeded["hasta_a"])
    r = client.put(
        "/hastalar/ben/mobil-cihaz",
        headers=headers,
        json={
            "push_token": "ExponentPushToken[test-hasta-a-device]",
            "platform": "android",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["platform"] == "android"
    assert body["aktif_mi"] is True

    row = session.exec(
        select(HastaMobilCihaz).where(
            HastaMobilCihaz.expo_push_token == "ExponentPushToken[test-hasta-a-device]"
        )
    ).first()
    assert row is not None
    assert row.kullanici_id == seeded["hasta_a"].id

    r = client.delete(
        "/hastalar/ben/mobil-cihaz",
        headers=headers,
        params={"push_token": "ExponentPushToken[test-hasta-a-device]"},
    )
    assert r.status_code == 204
    session.refresh(row)
    assert row.aktif_mi is False
