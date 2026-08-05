"""Mobil push (Expo) soyutlaması."""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request
from typing import Any, Protocol

from app.core.config import get_settings

logger = logging.getLogger("hastane.push")


class PushPort(Protocol):
    def push_gonder(
        self,
        tokens: list[str],
        *,
        baslik: str,
        mesaj: str,
        data: dict[str, Any] | None = None,
    ) -> None: ...


class ConsolePush:
    def push_gonder(
        self,
        tokens: list[str],
        *,
        baslik: str,
        mesaj: str,
        data: dict[str, Any] | None = None,
    ) -> None:
        for t in tokens:
            print(
                f"[PUSH] token={t[:24]}… baslik={baslik!r} mesaj={mesaj!r} data={data}"
            )


class ExpoPush:
    """Expo Push API — https://docs.expo.dev/push-notifications/sending-notifications/"""

    def push_gonder(
        self,
        tokens: list[str],
        *,
        baslik: str,
        mesaj: str,
        data: dict[str, Any] | None = None,
    ) -> None:
        if not tokens:
            return
        messages = [
            {
                "to": token,
                "title": baslik,
                "body": mesaj,
                "data": data or {},
                "sound": "default",
            }
            for token in tokens
        ]
        body = json.dumps(messages).encode("utf-8")
        req = urllib.request.Request(
            "https://exp.host/--/api/v2/push/send",
            data=body,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST",
        )
        access = get_settings().EXPO_ACCESS_TOKEN.strip()
        if access:
            req.add_header("Authorization", f"Bearer {access}")
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                raw = resp.read().decode("utf-8")
                logger.info("Expo push yanıtı: %s", raw[:500])
        except urllib.error.HTTPError as e:
            logger.exception("Expo push HTTP hata: %s", e.read().decode("utf-8", errors="replace"))
        except Exception:
            logger.exception("Expo push gönderilemedi")


def get_push() -> PushPort:
    backend = get_settings().PUSH_BACKEND.lower().strip()
    if backend == "expo":
        return ExpoPush()
    return ConsolePush()
