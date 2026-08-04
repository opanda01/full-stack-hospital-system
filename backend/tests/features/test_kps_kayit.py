"""KPS_DOGRULAMA_ZORUNLU kayıt path testleri."""

from app.core.tc_kimlik import tc_ilk_dokuz_haneden
from tests.conftest import auth_header


def test_otp_kayit_kps_zorunlu_basarisiz(client, monkeypatch):
    monkeypatch.setenv("KPS_DOGRULAMA_ZORUNLU", "true")
    from app.core.config import get_settings

    get_settings.cache_clear()
    # Mock KPS fail
    monkeypatch.setenv("MOCK_ENTEGRASYON_FAIL", "true")
    get_settings.cache_clear()
    from app.integrations.factory import get_kps

    get_kps.cache_clear()

    tc = tc_ilk_dokuz_haneden("940000001")
    r = client.post(
        "/auth/otp/gonder",
        json={"telefon": "05559876543", "tc_kimlik_no": tc, "amac": "KAYIT"},
    )
    assert r.status_code == 422
    detail = r.json().get("detail") or {}
    assert detail.get("kod") == "KPS_DOGRULAMA_BASARISIZ"

    get_settings.cache_clear()
    get_kps.cache_clear()


def test_otp_kayit_kps_kapali_ok(client, monkeypatch):
    monkeypatch.setenv("KPS_DOGRULAMA_ZORUNLU", "false")
    monkeypatch.setenv("MOCK_ENTEGRASYON_FAIL", "false")
    from app.core.config import get_settings
    from app.integrations.factory import get_kps

    get_settings.cache_clear()
    get_kps.cache_clear()

    tc = tc_ilk_dokuz_haneden("940000002")
    r = client.post(
        "/auth/otp/gonder",
        json={"telefon": "05559876544", "tc_kimlik_no": tc, "amac": "KAYIT"},
    )
    assert r.status_code == 200
