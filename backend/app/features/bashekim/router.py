"""TTL-backed bashekim özet + PHI audit yardımcısı."""

from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlmodel import Session, col, func, select

from app.core.audit import denetim_kaydi_yaz
from app.core.cache import get_json, invalidate, set_json
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

_OZET_CACHE_KEY = "bashekim:ozet"
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
    invalidate(_OZET_CACHE_KEY)


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
    bugun_bas = datetime(bugun.year, bugun.month, bugun.day, tzinfo=timezone.utc)
    bugun_bit = bugun_bas + timedelta(days=1)
    bugun_randevu = session.exec(
        select(func.count())
        .select_from(Randevu)
        .where(
            Randevu.durum != "IPTAL",
            Randevu.tarih_saat >= bugun_bas,
            Randevu.tarih_saat < bugun_bit,
        )
    ).one()

    acik_sikayet = session.exec(select(func.count()).select_from(SikayetOneri)).one()

    bekleyen_tetkik = session.exec(
        select(func.count())
        .select_from(Tetkik)
        .where(
            col(Tetkik.durum).in_(
                ["ISTENDI", "BEKLEMEDE", "ISLENIYOR", "ISTEK_ALINDI", ""]
            )
        )
    ).one()

    acik_temizlik = session.exec(
        select(func.count())
        .select_from(TemizlikGorevi)
        .where(~col(TemizlikGorevi.durum).in_(["TAMAMLANDI", "IPTAL"]))
    ).one()

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
        cutoff = datetime.now(timezone.utc) - timedelta(days=retention)
        q = q.where(DenetimKaydi.zaman >= cutoff)
    q = q.order_by(col(DenetimKaydi.zaman).desc()).limit(8)
    son = []
    for k in session.exec(q).all():
        # detay asla yok — PHI sızıntı önleme
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
        bugun_randevu=int(bugun_randevu or 0),
        acik_sikayet=int(acik_sikayet or 0),
        bekleyen_tetkik=int(bekleyen_tetkik or 0),
        acik_temizlik=int(acik_temizlik or 0),
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
    cached = get_json(_OZET_CACHE_KEY)
    if cached is not None:
        return BashekimOzet(**{**cached, "cached": True})
    data = _build_ozet(session)
    set_json(_OZET_CACHE_KEY, data.model_dump(mode="json"), _OZET_TTL_SEC)
    return data
