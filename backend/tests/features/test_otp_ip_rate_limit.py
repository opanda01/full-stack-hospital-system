"""OTP IP rate limit middleware testleri."""

from app.core.login_rate_limit import _local_hits
from app.core.tc_kimlik import tc_ilk_dokuz_haneden


def test_otp_ip_rate_limit_middleware(client, monkeypatch):
    monkeypatch.setenv("LOGIN_RATE_LIMIT_PER_MINUTE", "2")
    from app.core.config import get_settings

    get_settings.cache_clear()
    _local_hits.clear()

    tc = tc_ilk_dokuz_haneden("950000001")
    payload = {"telefon": "05551110001", "tc_kimlik_no": tc, "amac": "KAYIT"}
    assert client.post("/auth/otp/gonder", json=payload).status_code == 200
    # Aynı IP ikinci istek — telefon rate limit ayrı; farklı telefon
    payload2 = {
        "telefon": "05551110002",
        "tc_kimlik_no": tc_ilk_dokuz_haneden("950000002"),
        "amac": "KAYIT",
    }
    assert client.post("/auth/otp/gonder", json=payload2).status_code == 200
    payload3 = {
        "telefon": "05551110003",
        "tc_kimlik_no": tc_ilk_dokuz_haneden("950000003"),
        "amac": "KAYIT",
    }
    r3 = client.post("/auth/otp/gonder", json=payload3)
    assert r3.status_code == 429

    get_settings.cache_clear()
    _local_hits.clear()
