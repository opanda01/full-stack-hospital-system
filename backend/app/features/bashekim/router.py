"""TTL-backed bashekim özet + PHI audit yardımcısı."""

import time
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlmodel import Session, col, func, select

from app.core.audit import denetim_kaydi_yaz
from app.core.config import get_settings
from app.core.db import get_session
from app.core.enums import ErisimDurumu, KlinikOnayDurumu
from app.core.request_ip import istemci_ip_al
from app.core.security import require_permission
from app.features.auth.models import DenetimKaydi
from app.features.kullanicilar.models import Kullanici
from app.features.randevular.models import Randevu
from app.features.sikayet_oneri.models import SikayetOneri
from app.features.temizlik_gorevleri.models import TemizlikGorevi
from app.features.tetkikler.models import Tetkik

router = APIRouter()

_OZET_CACHE: dict[str, Any] = {"ts": 0.0, "data": None}
_OZET_TTL_SEC = 45


class BashekimOzet(BaseModel):
    bekleyen_erisim: int
    bugun_randevu: int
    acik_sikayet: int
    bekleyen_tetkik: int
    acik_temizlik: int
    bekleyen_klinik_onay: int
    son_denetim: list[dict[str, Any]]
    cache_ttl_sec: int
    cached: bool


def invalidate_bashekim_ozet() -> None:
    _OZET_CACHE["ts"] = 0.0
    _OZET_CACHE["data"] = None


def phi_goruntuleme_logla(
    session: Session,
    *,
    actor: Kullanici,
    kaynak: str,
    kaynak_id: int | str,
    request: Request | None = None,
) -> None:
    denetim_kaydi_yaz(
        session,
        aksiyon="KAYIT_GORUNTULEME",
        actor_id=actor.id,
        kaynak=kaynak,
        kaynak_id=kaynak_id,
        ip_adresi=istemci_ip_al(request) if request else None,
        commit=True,
    )


def _build_ozet(session: Session) -> BashekimOzet:
    bekleyen_erisim = session.exec(
        select(func.count())
        .select_from(Kullanici)
        .where(Kullanici.erisim_durumu == ErisimDurumu.BEKLEMEDE)
    ).one()

    bugun = date.today()
    # tarih_saat string/datetime — count loosely via all + filter if needed
    randevular = list(session.exec(select(Randevu)).all())
    bugun_randevu = 0
    for r in randevular:
        ts = getattr(r, "tarih_saat", None)
        if ts is None:
            continue
        if isinstance(ts, datetime):
            d = ts.date()
        else:
            try:
                d = datetime.fromisoformat(str(ts).replace("Z", "+00:00")).date()
            except ValueError:
                continue
        durum = getattr(r, "durum", None)
        durum_s = durum.value if hasattr(durum, "value") else str(durum or "")
        if d == bugun and durum_s != "IPTAL":
            bugun_randevu += 1

    acik_sikayet = session.exec(select(func.count()).select_from(SikayetOneri)).one()

    bekleyen_tetkik = 0
    for t in session.exec(select(Tetkik)).all():
        durum = getattr(t, "durum", None)
        ds = durum.value if hasattr(durum, "value") else str(durum or "")
        if ds in ("ISTENDI", "BEKLEMEDE", "ISLENIYOR", ""):
            bekleyen_tetkik += 1

    acik_temizlik = 0
    for t in session.exec(select(TemizlikGorevi)).all():
        durum = getattr(t, "durum", None)
        ds = durum.value if hasattr(durum, "value") else str(durum or "")
        if ds not in ("TAMAMLANDI", "IPTAL"):
            acik_temizlik += 1

    bekleyen_klinik = 0
    try:
        from app.features.klinik_onay.models import KlinikOnayKaydi

        bekleyen_klinik = session.exec(
            select(func.count())
            .select_from(KlinikOnayKaydi)
            .where(KlinikOnayKaydi.onay_durumu == KlinikOnayDurumu.BEKLEMEDE)
        ).one()
    except Exception:
        bekleyen_klinik = 0

    settings = get_settings()
    retention = settings.AUDIT_RETENTION_DAYS
    q = select(DenetimKaydi)
    if retention > 0:
        cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(
            days=retention
        )
        q = q.where(DenetimKaydi.zaman >= cutoff)
    q = q.order_by(col(DenetimKaydi.zaman).desc()).limit(8)
    son = []
    for k in session.exec(q).all():
        son.append(
            {
                "id": k.id,
                "aksiyon": k.aksiyon,
                "kaynak": k.kaynak,
                "kaynak_id": k.kaynak_id,
                "zaman": k.zaman.isoformat() if k.zaman else None,
            }
        )

    return BashekimOzet(
        bekleyen_erisim=int(bekleyen_erisim or 0),
        bugun_randevu=bugun_randevu,
        acik_sikayet=int(acik_sikayet or 0),
        bekleyen_tetkik=bekleyen_tetkik,
        acik_temizlik=acik_temizlik,
        bekleyen_klinik_onay=int(bekleyen_klinik or 0),
        son_denetim=son,
        cache_ttl_sec=_OZET_TTL_SEC,
        cached=False,
    )


@router.get("/ozet", response_model=BashekimOzet)
def bashekim_ozet(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("bashekim:ozet")),
):
    now = time.time()
    if _OZET_CACHE["data"] is not None and (now - _OZET_CACHE["ts"]) < _OZET_TTL_SEC:
        data: BashekimOzet = _OZET_CACHE["data"]
        return data.model_copy(update={"cached": True})
    data = _build_ozet(session)
    _OZET_CACHE["ts"] = now
    _OZET_CACHE["data"] = data
    return data
