from datetime import date, datetime, timezone

from fastapi import HTTPException
from sqlmodel import Session, col, or_, select

from app.core.base_model import utc_now
from app.core.enums import GuvenlikOlayDurumu, KayipEsyaDurumu
from app.core.lookups import personel_getir
from app.features.guvenlik.models import (
    GuvenlikDevriye,
    GuvenlikOlayi,
    GuvenlikZiyaretci,
    KayipEsya,
)
from app.features.guvenlik.schemas import (
    DevriyeCreate,
    DevriyeUpdate,
    GuvenlikOlayCreate,
    GuvenlikOlayUpdate,
    GuvenlikOzet,
    KayipEsyaCreate,
    KayipEsyaUpdate,
    RefakatciSorguSonuc,
    ZiyaretciCreate,
    ZiyaretciUpdate,
)
from app.features.kullanicilar.models import Kullanici
from app.features.nobet_cizelgesi.models import NobetCizelgesi
from app.features.yatis.models import Refakatci, Servis, Yatak, YatisKaydi


def ozet(session: Session, current_user: Kullanici) -> GuvenlikOzet:
    bugun = date.today()
    bugun_bas = datetime(bugun.year, bugun.month, bugun.day, tzinfo=timezone.utc)

    acik_olay = len(
        list(
            session.exec(
                select(GuvenlikOlayi).where(
                    col(GuvenlikOlayi.durum).in_(
                        [GuvenlikOlayDurumu.ACIK, GuvenlikOlayDurumu.MUDAHALE]
                    )
                )
            ).all()
        )
    )
    bugun_cozulen = len(
        list(
            session.exec(
                select(GuvenlikOlayi).where(
                    GuvenlikOlayi.durum == GuvenlikOlayDurumu.COZULDU,
                    GuvenlikOlayi.updated_at >= bugun_bas,
                )
            ).all()
        )
    )
    acik_ziyaretci = len(
        list(
            session.exec(
                select(GuvenlikZiyaretci).where(GuvenlikZiyaretci.cikis_zamani.is_(None))  # type: ignore[union-attr]
            ).all()
        )
    )
    bekleyen_kayip = len(
        list(
            session.exec(
                select(KayipEsya).where(KayipEsya.durum == KayipEsyaDurumu.BEKLIYOR)
            ).all()
        )
    )

    aktif_vardiya = 0
    nobet_saati: str | None = None
    try:
        personel = personel_getir(session, current_user.id)
        nobetler = list(
            session.exec(
                select(NobetCizelgesi).where(
                    NobetCizelgesi.personel_id == personel.id,
                    NobetCizelgesi.tarih == bugun,
                )
            ).all()
        )
        aktif_vardiya = 1 if nobetler else 0
        if nobetler:
            nobet_saati = nobetler[0].vardiya
    except HTTPException:
        pass

    return GuvenlikOzet(
        aktif_vardiya=aktif_vardiya,
        acik_olay=acik_olay,
        bugun_cozulen=bugun_cozulen,
        nobet_saati=nobet_saati,
        acik_ziyaretci=acik_ziyaretci,
        bekleyen_kayip_esya=bekleyen_kayip,
    )


def olay_listele(session: Session) -> list[GuvenlikOlayi]:
    return list(
        session.exec(
            select(GuvenlikOlayi).order_by(col(GuvenlikOlayi.olay_zamani).desc())
        ).all()
    )


def olay_olustur(
    session: Session, current_user: Kullanici, veri: GuvenlikOlayCreate
) -> GuvenlikOlayi:
    olay = GuvenlikOlayi(
        tip=veri.tip,
        yer=veri.yer,
        ozet=veri.ozet,
        olay_zamani=veri.olay_zamani or utc_now(),
        olusturan_id=current_user.id,
        beyaz_kod_referans=veri.beyaz_kod_referans,
        kolluk_bilgilendirildi=veri.kolluk_bilgilendirildi,
        durum=GuvenlikOlayDurumu.ACIK,
    )
    session.add(olay)
    session.commit()
    session.refresh(olay)
    return olay


def olay_guncelle(
    session: Session, olay_id: int, veri: GuvenlikOlayUpdate
) -> GuvenlikOlayi:
    olay = session.get(GuvenlikOlayi, olay_id)
    if olay is None:
        raise HTTPException(status_code=404, detail="Olay bulunamadı")
    if veri.durum is not None:
        olay.durum = veri.durum
    if veri.mudahale_notu is not None:
        olay.mudahale_notu = veri.mudahale_notu
    if veri.beyaz_kod_referans is not None:
        olay.beyaz_kod_referans = veri.beyaz_kod_referans
    if veri.kolluk_bilgilendirildi is not None:
        olay.kolluk_bilgilendirildi = veri.kolluk_bilgilendirildi
    olay.updated_at = utc_now()
    session.add(olay)
    session.commit()
    session.refresh(olay)
    return olay


def ziyaretci_listele(session: Session, sadece_acik: bool = False) -> list[GuvenlikZiyaretci]:
    q = select(GuvenlikZiyaretci).order_by(col(GuvenlikZiyaretci.giris_zamani).desc())
    if sadece_acik:
        q = q.where(GuvenlikZiyaretci.cikis_zamani.is_(None))  # type: ignore[union-attr]
    return list(session.exec(q).all())


def ziyaretci_olustur(
    session: Session, current_user: Kullanici, veri: ZiyaretciCreate
) -> GuvenlikZiyaretci:
    kayit = GuvenlikZiyaretci(
        ad_soyad=veri.ad_soyad,
        tc_kimlik=veri.tc_kimlik,
        ziyaret_edilen=veri.ziyaret_edilen,
        servis=veri.servis,
        yatis_id=veri.yatis_id,
        kaydeden_id=current_user.id,
        notlar=veri.notlar,
    )
    session.add(kayit)
    session.commit()
    session.refresh(kayit)
    return kayit


def ziyaretci_guncelle(
    session: Session, ziyaretci_id: int, veri: ZiyaretciUpdate
) -> GuvenlikZiyaretci:
    kayit = session.get(GuvenlikZiyaretci, ziyaretci_id)
    if kayit is None:
        raise HTTPException(status_code=404, detail="Ziyaretçi kaydı bulunamadı")
    if veri.cikis_zamani is not None:
        kayit.cikis_zamani = veri.cikis_zamani
    if veri.notlar is not None:
        kayit.notlar = veri.notlar
    kayit.updated_at = utc_now()
    session.add(kayit)
    session.commit()
    session.refresh(kayit)
    return kayit


def ziyaretci_cikis(session: Session, ziyaretci_id: int) -> GuvenlikZiyaretci:
    return ziyaretci_guncelle(
        session, ziyaretci_id, ZiyaretciUpdate(cikis_zamani=utc_now())
    )


def kayip_esya_listele(session: Session) -> list[KayipEsya]:
    return list(
        session.exec(
            select(KayipEsya).order_by(col(KayipEsya.bulunan_tarih).desc())
        ).all()
    )


def kayip_esya_olustur(
    session: Session, current_user: Kullanici, veri: KayipEsyaCreate
) -> KayipEsya:
    kayit = KayipEsya(
        tanim=veri.tanim,
        bulunan_yer=veri.bulunan_yer,
        bulunan_tarih=veri.bulunan_tarih or utc_now(),
        kaydeden_id=current_user.id,
        notlar=veri.notlar,
        durum=KayipEsyaDurumu.BEKLIYOR,
    )
    session.add(kayit)
    session.commit()
    session.refresh(kayit)
    return kayit


def kayip_esya_guncelle(
    session: Session, esya_id: int, veri: KayipEsyaUpdate
) -> KayipEsya:
    kayit = session.get(KayipEsya, esya_id)
    if kayit is None:
        raise HTTPException(status_code=404, detail="Kayıp eşya bulunamadı")
    if veri.durum is not None:
        kayit.durum = veri.durum
    if veri.teslim_alan is not None:
        kayit.teslim_alan = veri.teslim_alan
    if veri.notlar is not None:
        kayit.notlar = veri.notlar
    kayit.updated_at = utc_now()
    session.add(kayit)
    session.commit()
    session.refresh(kayit)
    return kayit


def devriye_listele(session: Session) -> list[GuvenlikDevriye]:
    return list(
        session.exec(
            select(GuvenlikDevriye).order_by(col(GuvenlikDevriye.baslangic).desc())
        ).all()
    )


def devriye_olustur(
    session: Session, current_user: Kullanici, veri: DevriyeCreate
) -> GuvenlikDevriye:
    personel = personel_getir(session, current_user.id)
    kayit = GuvenlikDevriye(
        bolge=veri.bolge,
        baslangic=veri.baslangic or utc_now(),
        bulgu=veri.bulgu,
        personel_id=personel.id,
    )
    session.add(kayit)
    session.commit()
    session.refresh(kayit)
    return kayit


def devriye_guncelle(
    session: Session, devriye_id: int, veri: DevriyeUpdate
) -> GuvenlikDevriye:
    kayit = session.get(GuvenlikDevriye, devriye_id)
    if kayit is None:
        raise HTTPException(status_code=404, detail="Devriye kaydı bulunamadı")
    if veri.bitis is not None:
        kayit.bitis = veri.bitis
    if veri.bulgu is not None:
        kayit.bulgu = veri.bulgu
    kayit.updated_at = utc_now()
    session.add(kayit)
    session.commit()
    session.refresh(kayit)
    return kayit


def refakatci_sorgula(session: Session, q: str) -> list[RefakatciSorguSonuc]:
    q = (q or "").strip()
    if len(q) < 2:
        return []

    pattern = f"%{q}%"
    rows = session.exec(
        select(Refakatci, YatisKaydi, Servis, Yatak)
        .join(YatisKaydi, Refakatci.yatis_id == YatisKaydi.id)
        .join(Servis, YatisKaydi.servis_id == Servis.id)
        .outerjoin(Yatak, YatisKaydi.yatak_id == Yatak.id)
        .where(
            YatisKaydi.aktif_mi.is_(True),  # type: ignore[union-attr]
            or_(
                col(Refakatci.ad_soyad).ilike(pattern),
                col(YatisKaydi.protokol_no).ilike(pattern),
            ),
        )
        .limit(25)
    ).all()

    sonuclar: list[RefakatciSorguSonuc] = []
    for ref, yatis, servis, yatak in rows:
        sonuclar.append(
            RefakatciSorguSonuc(
                yatis_id=yatis.id,
                refakatci_ad_soyad=ref.ad_soyad,
                yakinlik=ref.yakinlik,
                servis_adi=servis.ad if servis else None,
                yatak_kodu=(
                    f"{yatak.oda_no}-{yatak.yatak_no}" if yatak else None
                ),
                protokol_no=yatis.protokol_no,
            )
        )
    return sonuclar
