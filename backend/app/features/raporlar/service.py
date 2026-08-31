"""Sunucu tarafı rapor agregasyonları — dashboard mantığının tarih aralıklı genişletmesi."""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import case
from sqlmodel import Session, col, func, select

from app.core.enums import EpikrizDurumu, KlinikOnayDurumu, TriyajRenk, YatakDurumu
from app.features.acil.models import AcilTriyajKaydi
from app.features.departmanlar.models import Departman
from app.features.doner_sermaye.models import DonerSermayeKayit
from app.features.epikriz.models import Epikriz
from app.features.faturalandirma.models import Fatura
from app.features.hastalar.models import Hasta
from app.features.randevular.models import Randevu
from app.features.raporlar.schemas import (
    FinansRaporRead,
    GunlukAdet,
    KlinikRaporRead,
    RandevuRaporRead,
    RaporDagilim,
    ServisDolulukSatir,
    YatakRaporRead,
    YatisRaporRead,
)
from app.features.sikayet_oneri.models import SikayetOneri
from app.features.sikayet_oneri.service import BEKLEYEN_DURUMLAR
from app.features.tetkikler.models import Tetkik
from app.features.yatak_yonetimi.models import Oda, Servis, Yatak
from app.features.yatis.models import YatisKaydi


def _tarih_araligi(
    baslangic: date | None, bitis: date | None, *, varsayilan_gun: int = 30
) -> tuple[date, date]:
    bugun = date.today()
    bit = bitis or bugun
    bas = baslangic or (bit - timedelta(days=varsayilan_gun - 1))
    if bas > bit:
        bas, bit = bit, bas
    return bas, bit


def _datetime_araligi(bas: date, bit: date) -> tuple[datetime, datetime]:
    bas_dt = datetime(bas.year, bas.month, bas.day, tzinfo=timezone.utc)
    bit_dt = datetime(bit.year, bit.month, bit.day, tzinfo=timezone.utc) + timedelta(days=1)
    return bas_dt, bit_dt


def _zero_fill_gunluk(rows: dict[date, int], bas: date, bit: date) -> list[GunlukAdet]:
    gun_sayisi = (bit - bas).days + 1
    return [
        GunlukAdet(
            tarih=(bas + timedelta(days=i)).isoformat(),
            adet=rows.get(bas + timedelta(days=i), 0),
        )
        for i in range(gun_sayisi)
    ]


def randevu_raporu(
    session: Session,
    *,
    baslangic: date | None = None,
    bitis: date | None = None,
    departman_id: int | None = None,
    durum: str | None = None,
) -> RandevuRaporRead:
    bas, bit = _tarih_araligi(baslangic, bitis)
    bas_dt, bit_dt = _datetime_araligi(bas, bit)

    filtre = [
        Randevu.tarih_saat >= bas_dt,
        Randevu.tarih_saat < bit_dt,
    ]
    if departman_id is not None:
        filtre.append(Randevu.departman_id == departman_id)
    if durum:
        filtre.append(Randevu.durum == durum)

    toplam = int(
        session.exec(
            select(func.count()).select_from(Randevu).where(*filtre)
        ).one()
        or 0
    )

    no_show = int(
        session.exec(
            select(func.count())
            .select_from(Randevu)
            .where(*filtre, Randevu.durum == "GELMEDI")
        ).one()
        or 0
    )

    durum_rows = session.exec(
        select(Randevu.durum, func.count())
        .select_from(Randevu)
        .where(*filtre)
        .group_by(Randevu.durum)
    ).all()
    durum_dagilimi = [
        RaporDagilim(etiket=str(d or "BILINMIYOR"), deger=int(c)) for d, c in durum_rows
    ]

    gun_expr = func.date(Randevu.tarih_saat)
    gunluk_rows = session.exec(
        select(gun_expr, func.count())
        .select_from(Randevu)
        .where(*filtre)
        .group_by(gun_expr)
    ).all()
    gunluk_sayim: dict[date, int] = {}
    for gun_degeri, cnt in gunluk_rows:
        if gun_degeri is None:
            continue
        if isinstance(gun_degeri, str):
            gunluk_sayim[date.fromisoformat(gun_degeri)] = int(cnt or 0)
        else:
            gunluk_sayim[gun_degeri] = int(cnt or 0)

    dep_rows = session.exec(
        select(Departman.ad, func.count())
        .select_from(Randevu)
        .outerjoin(Departman, Departman.id == Randevu.departman_id)
        .where(*filtre)
        .group_by(Departman.ad)
    ).all()
    departman_dagilimi = [
        RaporDagilim(etiket=str(ad or "Bilinmiyor"), deger=int(c)) for ad, c in dep_rows
    ]

    return RandevuRaporRead(
        baslangic=bas,
        bitis=bit,
        toplam=toplam,
        no_show=no_show,
        durum_dagilimi=durum_dagilimi,
        gunluk_adet=_zero_fill_gunluk(gunluk_sayim, bas, bit),
        departman_dagilimi=departman_dagilimi,
    )


def servis_doluluk_listesi(session: Session) -> list[ServisDolulukSatir]:
    dolu_expr = func.sum(case((Yatak.durum == YatakDurumu.DOLU, 1), else_=0))
    rows = session.exec(
        select(
            Servis.id,
            Servis.ad,
            func.count(Yatak.id),
            dolu_expr,
        )
        .select_from(Servis)
        .outerjoin(Oda, Oda.servis_id == Servis.id)
        .outerjoin(Yatak, Yatak.oda_id == Oda.id)
        .group_by(Servis.id, Servis.ad)
        .order_by(Servis.ad)
    ).all()
    sonuc: list[ServisDolulukSatir] = []
    for servis_id, servis_adi, toplam, dolu in rows:
        toplam_i = int(toplam or 0)
        dolu_i = int(dolu or 0)
        oran = round(dolu_i / toplam_i, 2) if toplam_i > 0 else 0.0
        sonuc.append(
            ServisDolulukSatir(
                servis_id=int(servis_id),
                servis_adi=str(servis_adi),
                dolu=dolu_i,
                toplam=toplam_i,
                oran=oran,
            )
        )
    return sonuc


def yatis_raporu(
    session: Session,
    *,
    baslangic: date | None = None,
    bitis: date | None = None,
) -> YatisRaporRead:
    bas, bit = _tarih_araligi(baslangic, bitis)
    bas_dt, bit_dt = _datetime_araligi(bas, bit)

    aktif_yatis = int(
        session.exec(
            select(func.count())
            .select_from(YatisKaydi)
            .where(YatisKaydi.aktif_mi == True)  # noqa: E712
        ).one()
        or 0
    )

    los_rows = session.exec(
        select(YatisKaydi.yatis_tarihi, YatisKaydi.cikis_tarihi)
        .where(
            YatisKaydi.cikis_tarihi.isnot(None),  # type: ignore[union-attr]
            YatisKaydi.yatis_tarihi >= bas_dt,
            YatisKaydi.yatis_tarihi < bit_dt,
        )
    ).all()
    los_gunler: list[float] = []
    for yatis_t, cikis_t in los_rows:
        if yatis_t and cikis_t:
            delta = cikis_t - yatis_t
            los_gunler.append(max(delta.total_seconds() / 86400, 0))
    ortalama_los = round(sum(los_gunler) / len(los_gunler), 1) if los_gunler else 0.0

    gun_expr = func.date(YatisKaydi.yatis_tarihi)
    gunluk_rows = session.exec(
        select(gun_expr, func.count())
        .select_from(YatisKaydi)
        .where(gun_expr >= bas, gun_expr <= bit)
        .group_by(gun_expr)
    ).all()
    gunluk_sayim: dict[date, int] = {}
    for gun_degeri, cnt in gunluk_rows:
        if gun_degeri is None:
            continue
        if isinstance(gun_degeri, str):
            gunluk_sayim[date.fromisoformat(gun_degeri)] = int(cnt or 0)
        else:
            gunluk_sayim[gun_degeri] = int(cnt or 0)

    return YatisRaporRead(
        aktif_yatis=aktif_yatis,
        ortalama_los_gun=ortalama_los,
        servis_doluluk=servis_doluluk_listesi(session),
        gunluk_yatis=_zero_fill_gunluk(gunluk_sayim, bas, bit),
    )


def yatak_raporu(session: Session) -> YatakRaporRead:
    dolu = int(
        session.exec(
            select(func.count())
            .select_from(Yatak)
            .where(Yatak.durum == YatakDurumu.DOLU)
        ).one()
        or 0
    )
    bos = int(
        session.exec(
            select(func.count())
            .select_from(Yatak)
            .where(Yatak.durum == YatakDurumu.BOS)
        ).one()
        or 0
    )
    rezerve = int(
        session.exec(
            select(func.count())
            .select_from(Yatak)
            .where(Yatak.durum == YatakDurumu.TEMIZLIK_BEKLIYOR)
        ).one()
        or 0
    )
    arizali = int(
        session.exec(
            select(func.count())
            .select_from(Yatak)
            .where(Yatak.durum == YatakDurumu.ARIZALI)
        ).one()
        or 0
    )
    izolasyon_rows = session.exec(
        select(Yatak.izolasyon_tipi, func.count())
        .select_from(Yatak)
        .where(Yatak.izolasyon_tipi.isnot(None))  # type: ignore[union-attr]
        .group_by(Yatak.izolasyon_tipi)
    ).all()
    izolasyon_dagilimi = [
        RaporDagilim(etiket=str(tip or "YOK"), deger=int(c)) for tip, c in izolasyon_rows
    ]
    return YatakRaporRead(
        dolu=dolu,
        bos=bos,
        temizlik_bekleyen=rezerve,
        arizali=arizali,
        izolasyon_dagilimi=izolasyon_dagilimi,
    )


def finans_raporu(
    session: Session,
    *,
    baslangic: date | None = None,
    bitis: date | None = None,
) -> FinansRaporRead:
    bas, bit = _tarih_araligi(baslangic, bitis)
    bas_dt, bit_dt = _datetime_araligi(bas, bit)

    fatura_filtre = [Fatura.created_at >= bas_dt, Fatura.created_at < bit_dt]
    fatura_toplam = int(
        session.exec(
            select(func.count()).select_from(Fatura).where(*fatura_filtre)
        ).one()
        or 0
    )
    durum_rows = session.exec(
        select(Fatura.durum, func.count())
        .select_from(Fatura)
        .where(*fatura_filtre)
        .group_by(Fatura.durum)
    ).all()
    fatura_durum = [
        RaporDagilim(etiket=str(d or "BILINMIYOR"), deger=int(c)) for d, c in durum_rows
    ]
    tutar = session.exec(
        select(func.coalesce(func.sum(Fatura.tutar), 0)).where(*fatura_filtre)
    ).one()
    toplam_tutar = Decimal(str(tutar or 0))

    doner_rows = session.exec(select(DonerSermayeKayit)).all()
    doner_gelir = sum((r.gelir for r in doner_rows), Decimal("0"))
    doner_gider = sum((r.gider for r in doner_rows), Decimal("0"))

    return FinansRaporRead(
        fatura_toplam=fatura_toplam,
        fatura_durum_dagilimi=fatura_durum,
        toplam_tutar=toplam_tutar,
        doner_gelir=doner_gelir,
        doner_gider=doner_gider,
    )


def klinik_raporu(session: Session) -> KlinikRaporRead:
    tetkik_rows = session.exec(
        select(Tetkik.durum, func.count()).select_from(Tetkik).group_by(Tetkik.durum)
    ).all()
    tetkik_durum = [
        RaporDagilim(etiket=str(d or "BILINMIYOR"), deger=int(c)) for d, c in tetkik_rows
    ]

    renk_sayim: dict[str, int] = {r.value: 0 for r in TriyajRenk}
    triyaj_rows = session.exec(
        select(AcilTriyajKaydi.renk, func.count())
        .select_from(AcilTriyajKaydi)
        .group_by(AcilTriyajKaydi.renk)
    ).all()
    for renk, cnt in triyaj_rows:
        renk_sayim[str(renk)] = int(cnt)
    triyaj_renk = [
        RaporDagilim(etiket=k, deger=v) for k, v in renk_sayim.items() if v > 0
    ]

    sikayet_bekleyen = int(
        session.exec(
            select(func.count())
            .select_from(SikayetOneri)
            .where(col(SikayetOneri.durum).in_(tuple(BEKLEYEN_DURUMLAR)))
        ).one()
        or 0
    )
    epikriz_bekleyen = int(
        session.exec(
            select(func.count())
            .select_from(Epikriz)
            .where(Epikriz.durum == EpikrizDurumu.TASLAK.value)
        ).one()
        or 0
    )
    no_show_hasta = int(
        session.exec(
            select(func.count())
            .select_from(Hasta)
            .where(Hasta.gelmeyen_randevu_sayisi > 0)
        ).one()
        or 0
    )

    return KlinikRaporRead(
        tetkik_durum_dagilimi=tetkik_durum,
        triyaj_renk_dagilimi=triyaj_renk,
        sikayet_bekleyen=sikayet_bekleyen,
        epikriz_onay_bekleyen=epikriz_bekleyen,
        no_show_hasta=no_show_hasta,
    )
