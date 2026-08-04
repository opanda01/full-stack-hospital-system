"""TC kimlik doğrulama unit testleri."""

from pydantic import ValidationError
import pytest

from app.core.tc_kimlik import (
    TC_GECERSIZ_MESAJ,
    gecerli_tc_kimlik_no,
    tc_kimlik_dogrula_veya_none,
)
from app.features.auth.schemas import OtpGonderRequest
from app.core.enums import OtpAmac


def _tc_from_nine(first9: str) -> str:
    digits = [int(c) for c in first9]
    odd_sum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8]
    even_sum = digits[1] + digits[3] + digits[5] + digits[7]
    d10 = (odd_sum * 7 - even_sum) % 10
    d11 = (sum(digits) + d10) % 10
    return first9 + str(d10) + str(d11)


@pytest.mark.parametrize(
    "tc",
    [
        "10000000146",
        "11111111110",
        "22222222220",
        _tc_from_nine("910000000"),
        _tc_from_nine("910000001"),
    ],
)
def test_gecerli_tc(tc: str) -> None:
    assert gecerli_tc_kimlik_no(tc)


@pytest.mark.parametrize(
    "tc",
    [
        "",
        "123",
        "1234567890",
        "123456789012",
        "02345678901",
        "12345678901",
        "11111111111",
        "abcdefghijk",
    ],
)
def test_gecersiz_tc(tc: str) -> None:
    assert not gecerli_tc_kimlik_no(tc)


def test_tc_kimlik_dogrula_veya_none() -> None:
    assert tc_kimlik_dogrula_veya_none(None) is None
    assert tc_kimlik_dogrula_veya_none("") is None
    assert tc_kimlik_dogrula_veya_none("  ") is None
    assert tc_kimlik_dogrula_veya_none("10000000146") == "10000000146"
    with pytest.raises(ValueError, match=TC_GECERSIZ_MESAJ):
        tc_kimlik_dogrula_veya_none("12345678901")


def test_otp_schema_rejects_invalid_tc() -> None:
    with pytest.raises(ValidationError):
        OtpGonderRequest(
            telefon="05551234567",
            tc_kimlik_no="12345678901",
            amac=OtpAmac.KAYIT,
        )


def test_otp_schema_accepts_valid_tc() -> None:
    req = OtpGonderRequest(
        telefon="05551234567",
        tc_kimlik_no="10000000146",
        amac=OtpAmac.KAYIT,
    )
    assert req.tc_kimlik_no == "10000000146"


def test_otp_endpoint_invalid_tc(client) -> None:
    r = client.post(
        "/auth/otp/gonder",
        json={
            "telefon": "05551234567",
            "tc_kimlik_no": "12345678901",
            "amac": "KAYIT",
        },
    )
    assert r.status_code == 422
