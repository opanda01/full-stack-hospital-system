from datetime import datetime, timezone

from sqlmodel import Session, select

from app.core.enums import EpikrizDurumu, KlinikOnayDurumu
from app.core.lookups import hasta_getir
from app.core.pagination import Page, make_page
from app.core.timezone import as_utc
from app.features.kullanicilar.models import Kullanici
from app.features.epikriz.models import Epikriz
from app.features.hastalar.phr_schemas import (
    HastaBelgeRead,
    HastaOzetRead,
    HastaYatisOzetRead,
)
from app.features.klinik_onay.models import KlinikOnayKaydi
from app.features.kullanicilar.models import Kullanici
from app.features.randevular import service as randevu_service
from app.features.randevular.models import Randevu
from app.features.randevular.router import _to_read as randevu_to_read
from app.features.tetkikler.models import Tetkik
from app.features.tetkikler import service as tetkik_service
from app.features.yatak_yonetimi.models import Servis, Yatak
from app.features.yatak_yonetimi.service import yatak_oda_bilgi
from app.features.yatis.models import YatisKaydi


def _belge_baslik_klinik(tur: str) -> str:
    if tur == "RECETE":
        return "Onaylı reçete"
    if tur == "SEVK":
        return "Onaylı sevk"
    if tur == "TIBBI_RAPOR":
        return "Onaylı tıbbi rapor"
    return tur


def list_benim_belgeler(
    session: Session,
    current_user: Kullanici,
    *,
    page: int = 1,
    page_size: int = 50,
) -> Page[HastaBelgeRead]:
    hasta = hasta_getir(session, current_user.id)
    assert hasta.id is not None
    hasta_pk = hasta.id

    epikriz_rows = session.exec(
        select(Epikriz)
        .where(
            Epikriz.hasta_id == hasta_pk,
            Epikriz.durum == EpikrizDurumu.ONAYLANDI.value,
        )
        .order_by(Epikriz.id.desc())
    ).all()
    klinik_rows = session.exec(
        select(KlinikOnayKaydi)
        .where(
            KlinikOnayKaydi.hasta_id == hasta_pk,
            KlinikOnayKaydi.onay_durumu == KlinikOnayDurumu.ONAYLANDI,
        )
        .order_by(KlinikOnayKaydi.id.desc())
    ).all()

    combined: list[HastaBelgeRead] = []
    for e in epikriz_rows:
        combined.append(
            HastaBelgeRead(
                kaynak="EPIKRIZ",
                id=e.id,  # type: ignore[arg-type]
                tur="EPIKRIZ",
                baslik=f"Epikriz #{e.id}",
                ozet=(e.tani or e.tedavi_ozeti or "")[:300] or None,
                durum=e.durum,
                tarih=e.onaylandi_at or e.updated_at,
            )
        )
    for k in klinik_rows:
        combined.append(
            HastaBelgeRead(
                kaynak="KLINIK_ONAY",
                id=k.id,  # type: ignore[arg-type]
                tur=k.tur,
                baslik=_belge_baslik_klinik(k.tur),
                ozet=(k.icerik or "")[:300] or None,
                durum=k.onay_durumu.value
                if hasattr(k.onay_durumu, "value")
                else str(k.onay_durumu),
                tarih=k.onay_tarihi,
            )
        )

    combined.sort(
        key=lambda b: b.tarih or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    total = len(combined)
    start = (page - 1) * page_size
    end = start + page_size
    return make_page(combined[start:end], total=total, page=page, page_size=page_size)


def yatis_ozet(session: Session, current_user: Kullanici) -> HastaYatisOzetRead:
    hasta = hasta_getir(session, current_user.id)
    assert hasta.id is not None
    row = session.exec(
        select(YatisKaydi)
        .where(YatisKaydi.hasta_id == hasta.id)
        .order_by(YatisKaydi.yatis_tarihi.desc(), YatisKaydi.id.desc())
    ).first()
    if row is None:
        return HastaYatisOzetRead(aktif_mi=False)
    servis = session.get(Servis, row.servis_id) if row.servis_id else None
    yatak = session.get(Yatak, row.yatak_id) if row.yatak_id else None
    oda_no, yatak_no, _ = yatak_oda_bilgi(session, yatak)
    return HastaYatisOzetRead(
        aktif_mi=bool(row.aktif_mi),
        yatis_id=row.id,
        protokol_no=row.protokol_no,
        servis_adi=servis.ad if servis else None,
        yatak_no=yatak_no,
        oda_no=oda_no,
        yatis_tarihi=row.yatis_tarihi,
        taburcu_tarihi=row.taburcu_tarihi,
    )


def hasta_ozet(session: Session, current_user: Kullanici) -> HastaOzetRead:
    from app.core.permissions import Kapsam

    hasta = hasta_getir(session, current_user.id)
    assert hasta.id is not None
    k = session.get(Kullanici, current_user.id)
    ad_soyad = f"{k.ad} {k.soyad}".strip() if k else "Hasta"

    randevular = randevu_service.listele(session, current_user, Kapsam.KENDI_KAYDIM)
    now = datetime.now(timezone.utc)
    aktif = [r for r in randevular if r.durum != "IPTAL"]
    yaklasanlar = sorted(
        [r for r in aktif if as_utc(r.tarih_saat) >= now],
        key=lambda r: r.tarih_saat,
    )
    yaklasan_read = None
    if yaklasanlar:
        yaklasan_read = randevu_to_read(session, yaklasanlar[0])

    son_tetkik = session.exec(
        select(Tetkik)
        .where(Tetkik.hasta_id == hasta.id)
        .order_by(Tetkik.id.desc())
    ).first()

    return HastaOzetRead(
        ad_soyad=ad_soyad,
        yaklasan_randevu=yaklasan_read,
        yaklasan_randevu_sayisi=len(yaklasanlar),
        son_tetkik_turu=son_tetkik.tetkik_turu if son_tetkik else None,
        son_tetkik_durum=son_tetkik.durum if son_tetkik else None,
        son_tetkik_tarih=son_tetkik.created_at if son_tetkik else None,
        okunmamis_sonuc_sayisi=tetkik_service.okunmamis_sonuclanmis_sayisi(
            session, hasta.id
        ),
        yatis=yatis_ozet(session, current_user),
    )
