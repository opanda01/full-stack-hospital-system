"""Türkiye cep telefonu normalizasyonu (OTP eşleştirme)."""


def telefon_normalize(ham: str) -> str:
    """Rakam dışını at; +90/90 ve 10 haneli 5xx → 0xxxxxxxxxx."""
    s = "".join(ch for ch in (ham or "").strip() if ch.isdigit())
    if not s:
        return ""
    if s.startswith("90") and len(s) == 12:
        s = "0" + s[2:]
    elif len(s) == 10 and s[0] == "5":
        s = "0" + s
    return s
