"""Poliklinik randevu saat kuralları (Europe/Istanbul)."""

from datetime import date, datetime, time, timedelta, timezone

from app.core.timezone import ISTANBUL, as_utc, to_istanbul

SLOT_MINUTES = 15
CLINIC_OPEN = time(9, 0)
CLINIC_CLOSE = time(17, 0)
OGLEN_BAS = time(12, 0)
OGLEN_BIT = time(13, 0)


def _local_time(dt: datetime) -> time:
    return to_istanbul(as_utc(dt)).time()


def oglen_arasi_mi(dt: datetime) -> bool:
    """12:00–13:00 öğle arası (13:00 dahil değil)."""
    t = _local_time(dt)
    return OGLEN_BAS <= t < OGLEN_BIT


def klinik_saatleri_icinde_mi(dt: datetime) -> bool:
    t = _local_time(dt)
    if t < CLINIC_OPEN or t >= CLINIC_CLOSE:
        return False
    if oglen_arasi_mi(dt):
        return False
    return True


def iter_klinik_slotlari(gun: date) -> list[datetime]:
    """Gün için 09:00–17:00 arası öğle arası hariç 15 dk slotlar (İstanbul tz-aware)."""
    baslangic = datetime(gun.year, gun.month, gun.day, 9, 0, 0, tzinfo=ISTANBUL)
    bitis = datetime(gun.year, gun.month, gun.day, 17, 0, 0, tzinfo=ISTANBUL)
    out: list[datetime] = []
    cur = baslangic
    while cur < bitis:
        if not oglen_arasi_mi(cur.astimezone(timezone.utc)):
            out.append(cur)
        cur += timedelta(minutes=SLOT_MINUTES)
    return out
