"""Klinik saat dilimi — Europe/Istanbul (saklama UTC, gösterim TR)."""

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

ISTANBUL = ZoneInfo("Europe/Istanbul")


def as_utc(dt: datetime) -> datetime:
    """Naive → İstanbul niyeti; aware → UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=ISTANBUL).astimezone(timezone.utc)
    return dt.astimezone(timezone.utc)


def to_istanbul(dt: datetime) -> datetime:
    """API/UI için İstanbul duvar saati (TIMESTAMPTZ → +03:00)."""
    if dt.tzinfo is None:
        # Eski naive satırlar: UTC varsay (migration sonrası tz'siz kalmış olabilir)
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(ISTANBUL)
