"""Bildirim soyutlaması — sağlayıcıdan bağımsız port."""

from typing import Protocol

from app.core.config import get_settings


class BildirimPort(Protocol):
    def sms_gonder(self, telefon: str, mesaj: str) -> None: ...

    def email_gonder(self, email: str, konu: str, govde: str) -> None: ...


class ConsoleBildirim:
    """Geliştirme / test: SMS ve e-postayı stdout'a yazar."""

    def sms_gonder(self, telefon: str, mesaj: str) -> None:
        print(f"[BILDIRIM:SMS] to={telefon} mesaj={mesaj}")

    def email_gonder(self, email: str, konu: str, govde: str) -> None:
        print(f"[BILDIRIM:EMAIL] to={email} konu={konu} govde={govde}")


def get_bildirim() -> BildirimPort:
    backend = get_settings().BILDIRIM_BACKEND.lower().strip()
    if backend == "console":
        return ConsoleBildirim()
    # Bilinmeyen backend → console (güvenli varsayılan)
    return ConsoleBildirim()
