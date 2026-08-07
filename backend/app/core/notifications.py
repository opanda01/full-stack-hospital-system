"""Bildirim soyutlaması — sağlayıcıdan bağımsız port."""

from __future__ import annotations

import json
import logging
import smtplib
import urllib.error
import urllib.request
from email.message import EmailMessage
from typing import Protocol

from app.core.config import get_settings

logger = logging.getLogger("hastane.bildirim")


class BildirimPort(Protocol):
    def sms_gonder(self, telefon: str, mesaj: str) -> None: ...

    def email_gonder(self, email: str, konu: str, govde: str) -> None: ...


def _dlq_kaydet(
    kanal: str, hedef: str, govde: str, konu: str | None, hata: str
) -> None:
    try:
        from sqlmodel import Session

        from app.core.bildirim_dlq import dlq_ekle
        from app.core.db import engine

        with Session(engine) as session:
            dlq_ekle(
                session,
                kanal="SMS" if kanal == "SMS" else "EMAIL",
                hedef=hedef,
                govde=govde,
                konu=konu,
                hata=hata,
                commit=True,
            )
    except Exception:
        logger.exception("DLQ kaydı yazılamadı")


class ConsoleBildirim:
    """Geliştirme / test: SMS ve e-postayı stdout'a yazar."""

    def sms_gonder(self, telefon: str, mesaj: str) -> None:
        print(f"[BILDIRIM:SMS] to={telefon} mesaj={mesaj}")

    def email_gonder(self, email: str, konu: str, govde: str) -> None:
        print(f"[BILDIRIM:EMAIL] to={email} konu={konu} govde={govde}")


class LogBildirim:
    """Uygulama logger'ına yazar (staging)."""

    def sms_gonder(self, telefon: str, mesaj: str) -> None:
        logger.info("SMS to=%s mesaj=%s", telefon, mesaj)

    def email_gonder(self, email: str, konu: str, govde: str) -> None:
        logger.info("EMAIL to=%s konu=%s govde=%s", email, konu, govde)


class HttpSmsBildirim:
    """Generic HTTP SMS gateway — POST JSON {telefon, mesaj}."""

    def sms_gonder(self, telefon: str, mesaj: str) -> None:
        settings = get_settings()
        url = settings.SMS_GATEWAY_URL.strip()
        if not url:
            logger.warning("SMS_GATEWAY_URL tanımsız; SMS loglandı to=%s", telefon)
            return
        payload = json.dumps({"telefon": telefon, "mesaj": mesaj}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.SMS_GATEWAY_API_KEY}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                if resp.status >= 400:
                    raise RuntimeError(f"SMS gateway HTTP {resp.status}")
        except Exception as exc:
            _dlq_kaydet("SMS", telefon, mesaj, None, str(exc))
            raise

    def email_gonder(self, email: str, konu: str, govde: str) -> None:
        SmtpBildirim().email_gonder(email, konu, govde)


class SmtpBildirim:
    """SMTP e-posta gönderimi; SMS için log (SMS gateway yok)."""

    def sms_gonder(self, telefon: str, mesaj: str) -> None:
        logger.warning(
            "SMTP backend SMS desteklemez; SMS loglandı to=%s mesaj=%s",
            telefon,
            mesaj,
        )

    def email_gonder(self, email: str, konu: str, govde: str) -> None:
        settings = get_settings()
        if not settings.SMTP_HOST:
            logger.info(
                "SMTP_HOST tanımsız; e-posta loglandı to=%s konu=%s",
                email,
                konu,
            )
            return

        msg = EmailMessage()
        msg["Subject"] = konu
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USER or "noreply@localhost"
        msg["To"] = email
        msg.set_content(govde)

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
                smtp.ehlo()
                try:
                    smtp.starttls()
                    smtp.ehlo()
                except smtplib.SMTPException:
                    pass
                if settings.SMTP_USER:
                    smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                smtp.send_message(msg)
            logger.info("SMTP e-posta gönderildi to=%s konu=%s", email, konu)
        except Exception:
            logger.exception("SMTP e-posta gönderilemedi to=%s konu=%s", email, konu)
            _dlq_kaydet("EMAIL", email, govde, konu, "smtp failure")
            raise


def get_bildirim() -> BildirimPort:
    backend = get_settings().BILDIRIM_BACKEND.lower().strip()
    if backend == "log":
        return LogBildirim()
    if backend == "sms":
        return HttpSmsBildirim()
    if backend == "smtp":
        return SmtpBildirim()
    return ConsoleBildirim()
