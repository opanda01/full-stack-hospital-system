"""Rol dashboard KPI özetleri — full-list yerine SQL COUNT."""

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, func, select

from app.core.db import get_session
from app.core.enums import IlacTalepDurumu, KlinikOnayDurumu, Rol, TriyajRenk, YatakDurumu
from app.core.lookups import doktor_getir, personel_getir
from app.core.security import get_current_user, require_permission, require_role
from app.features.acil.models import AcilTriyajKaydi
from app.features.departmanlar.models import Departman
from app.features.hastalar.models import Hasta
from app.features.doktorlar.models import Doktor
from app.features.hastalar import service as hasta_service
from app.features.ilac_talep.models import IlacTalebi
from app.features.klinik_onay.models import KlinikOnayKaydi
from app.features.kullanicilar.models import Kullanici
from app.features.nobet_cizelgesi.models import NobetCizelgesi
from app.features.personel.models import Personel
from app.features.randevular.models import Randevu
from app.features.tetkikler.models import Tetkik
from app.features.yatak_yonetimi.models import Yatak
from app.features.yatis.models import HemsireGorevi, IlacUygulama, YatisKaydi

router = APIRouter()


class DoktorOzet(BaseModel):
    bugun_randevu: int
    bekleyen_muayene: int
    tamamlanan: int
    bekleyen_tetkik: int
    bekleyen_onay: int


class HemsireOzet(BaseModel):
    aktif_yatis: int
    bekleyen_ilac_talep: int
    bekleyen_gorev: int
    bekleyen_order: int
    randevu_sayisi: int
    nobet_bugun: int


class AdminOzet(BaseModel):
    kullanici_sayisi: int
    doktor_sayisi: int
    departman_sayisi: int
    personel_sayisi: int
    randevu_bekleyen: int
    randevu_toplam: int


class LaborantOzet(BaseModel):
    bekleyen_tetkik: int
    bugun_tamamlanan: int
    sonuc_girisi_bekleyen: int
    toplam_tetkik: int


class IdariOzet(BaseModel):
    bugun_hasta_kayit: int
    bekleyen_randevu: int
    ozel_kimlik_hasta: int
    departman_sayisi: int


class AnalyticsDagilim(BaseModel):
    etiket: str
    deger: int


class AnalyticsOzet(BaseModel):
    tetkik_durumlari: list[AnalyticsDagilim]
    triyaj_renkleri: list[AnalyticsDagilim]
    yatak_dolu: int
    yatak_bos: int
    no_show_hasta: int
    outbox_hata: int


@router.get("/doktor/ozet", response_model=DoktorOzet)
def doktor_ozet(
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("randevu:goruntule")),
):
    doktor = doktor_getir(session, current_user.id)
    bugun = date.today()
    bas = datetime(bugun.year, bugun.month, bugun.day, tzinfo=timezone.utc)
    bit = bas + timedelta(days=1)

    bugun_randevu = int(
        session.exec(
            select(func.count())
            .select_from(Randevu)
            .where(
                Randevu.doktor_id == doktor.id,
                Randevu.durum != "IPTAL",
                Randevu.tarih_saat >= bas,
                Randevu.tarih_saat < bit,
            )
        ).one()
        or 0
    )
    bekleyen_muayene = int(
        session.exec(
            select(func.count())
            .select_from(Randevu)
            .where(Randevu.doktor_id == doktor.id, Randevu.durum == "BEKLEMEDE")
        ).one()
        or 0
    )
    tamamlanan = int(
        session.exec(
            select(func.count())
            .select_from(Randevu)
            .where(Randevu.doktor_id == doktor.id, Randevu.durum == "TAMAMLANDI")
        ).one()
        or 0
    )
    bekleyen_tetkik = int(
        session.exec(
            select(func.count())
            .select_from(Tetkik)
            .where(
                Tetkik.istek_yapan_doktor_id == doktor.id,
                Tetkik.durum != "SONUCLANDI",
            )
        ).one()
        or 0
    )
    bekleyen_onay = int(
        session.exec(
            select(func.count())
            .select_from(KlinikOnayKaydi)
            .where(
                KlinikOnayKaydi.olusturan_id == current_user.id,
                KlinikOnayKaydi.onay_durumu == KlinikOnayDurumu.BEKLEMEDE,
            )
        ).one()
        or 0
    )
    return DoktorOzet(
        bugun_randevu=bugun_randevu,
        bekleyen_muayene=bekleyen_muayene,
        tamamlanan=tamamlanan,
        bekleyen_tetkik=bekleyen_tetkik,
        bekleyen_onay=bekleyen_onay,
    )


@router.get("/hemsire/ozet", response_model=HemsireOzet)
def hemsire_ozet(
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(get_current_user),
):
    ids = list(
        hasta_service.hemsire_erisebilir_hasta_idler(
            session, current_user, sadece_yatan=False
        )
    )
    aktif_yatis = 0
    if ids:
        aktif_yatis = int(
            session.exec(
                select(func.count())
                .select_from(YatisKaydi)
                .where(
                    YatisKaydi.aktif_mi == True,  # noqa: E712
                    YatisKaydi.hasta_id.in_(ids),
                )
            ).one()
            or 0
        )

    bekleyen_ilac = int(
        session.exec(
            select(func.count())
            .select_from(IlacTalebi)
            .where(IlacTalebi.durum == IlacTalepDurumu.ONAY_BEKLIYOR)
        ).one()
        or 0
    )

    personel = None
    try:
        personel = personel_getir(session, current_user.id)
    except Exception:
        personel = None

    bekleyen_gorev = 0
    if personel:
        bekleyen_gorev = int(
            session.exec(
                select(func.count())
                .select_from(HemsireGorevi)
                .where(
                    HemsireGorevi.atanan_hemsire_id == personel.id,
                    HemsireGorevi.tamamlandi_mi == False,  # noqa: E712
                )
            ).one()
            or 0
        )

    mar = 0
    tetkik_bekleyen = 0
    if ids:
        yatis_ids = list(
            session.exec(
                select(YatisKaydi.id).where(
                    YatisKaydi.aktif_mi == True,  # noqa: E712
                    YatisKaydi.hasta_id.in_(ids),
                )
            ).all()
        )
        if yatis_ids:
            mar = int(
                session.exec(
                    select(func.count())
                    .select_from(IlacUygulama)
                    .where(
                        IlacUygulama.durum == "BEKLIYOR",
                        IlacUygulama.yatis_id.in_(yatis_ids),
                    )
                ).one()
                or 0
            )
        tetkik_bekleyen = int(
            session.exec(
                select(func.count())
                .select_from(Tetkik)
                .where(
                    Tetkik.hasta_id.in_(ids),
                    Tetkik.durum == "ISTEK_ALINDI",
                )
            ).one()
            or 0
        )

    randevu_sayisi = 0
    if personel and personel.departman_id:
        randevu_sayisi = int(
            session.exec(
                select(func.count())
                .select_from(Randevu)
                .where(Randevu.departman_id == personel.departman_id)
            ).one()
            or 0
        )

    nobet_bugun = 0
    if personel:
        nobet_bugun = int(
            session.exec(
                select(func.count())
                .select_from(NobetCizelgesi)
                .where(
                    NobetCizelgesi.personel_id == personel.id,
                    NobetCizelgesi.tarih == date.today(),
                )
            ).one()
            or 0
        )

    return HemsireOzet(
        aktif_yatis=aktif_yatis,
        bekleyen_ilac_talep=bekleyen_ilac,
        bekleyen_gorev=bekleyen_gorev,
        bekleyen_order=mar + tetkik_bekleyen,
        randevu_sayisi=randevu_sayisi,
        nobet_bugun=nobet_bugun,
    )


@router.get("/admin/ozet", response_model=AdminOzet)
def admin_ozet(
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("personel:listele")),
):
    return AdminOzet(
        kullanici_sayisi=int(
            session.exec(select(func.count()).select_from(Kullanici)).one() or 0
        ),
        doktor_sayisi=int(
            session.exec(select(func.count()).select_from(Doktor)).one() or 0
        ),
        departman_sayisi=int(
            session.exec(select(func.count()).select_from(Departman)).one() or 0
        ),
        personel_sayisi=int(
            session.exec(select(func.count()).select_from(Personel)).one() or 0
        ),
        randevu_bekleyen=int(
            session.exec(
                select(func.count())
                .select_from(Randevu)
                .where(Randevu.durum == "BEKLEMEDE")
            ).one()
            or 0
        ),
        randevu_toplam=int(
            session.exec(select(func.count()).select_from(Randevu)).one() or 0
        ),
    )


@router.get("/laborant/ozet", response_model=LaborantOzet)
def laborant_ozet(
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("tetkik:goruntule")),
):
    bugun = date.today()
    bas = datetime(bugun.year, bugun.month, bugun.day, tzinfo=timezone.utc)
    bit = bas + timedelta(days=1)
    bekleyen = int(
        session.exec(
            select(func.count())
            .select_from(Tetkik)
            .where(Tetkik.durum != "SONUCLANDI")
        ).one()
        or 0
    )
    bugun_tam = int(
        session.exec(
            select(func.count())
            .select_from(Tetkik)
            .where(
                Tetkik.durum == "SONUCLANDI",
                Tetkik.updated_at >= bas,
                Tetkik.updated_at < bit,
            )
        ).one()
        or 0
    )
    giris_bekleyen = int(
        session.exec(
            select(func.count())
            .select_from(Tetkik)
            .where(Tetkik.durum == "ISTEK_ALINDI")
        ).one()
        or 0
    )
    toplam = int(session.exec(select(func.count()).select_from(Tetkik)).one() or 0)
    return LaborantOzet(
        bekleyen_tetkik=bekleyen,
        bugun_tamamlanan=bugun_tam,
        sonuc_girisi_bekleyen=giris_bekleyen,
        toplam_tetkik=toplam,
    )


@router.get("/idari/ozet", response_model=IdariOzet)
def idari_ozet(
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_role(Rol.IDARI_PERSONEL)),
):
    bugun = date.today()
    bas = datetime(bugun.year, bugun.month, bugun.day, tzinfo=timezone.utc)
    bit = bas + timedelta(days=1)
    bugun_kayit = int(
        session.exec(
            select(func.count())
            .select_from(Hasta)
            .where(Hasta.created_at >= bas, Hasta.created_at < bit)
        ).one()
        or 0
    )
    bekleyen_randevu = int(
        session.exec(
            select(func.count())
            .select_from(Randevu)
            .where(Randevu.durum == "BEKLEMEDE")
        ).one()
        or 0
    )
    ozel_kimlik = int(
        session.exec(
            select(func.count())
            .select_from(Hasta)
            .where(Hasta.kimlik_tipi != "TC")
        ).one()
        or 0
    )
    return IdariOzet(
        bugun_hasta_kayit=bugun_kayit,
        bekleyen_randevu=bekleyen_randevu,
        ozel_kimlik_hasta=ozel_kimlik,
        departman_sayisi=int(
            session.exec(select(func.count()).select_from(Departman)).one() or 0
        ),
    )


@router.get("/analytics/ozet", response_model=AnalyticsOzet)
def analytics_ozet(
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_role(Rol.ADMIN, Rol.BASHEKIM, Rol.MUDUR)),
):
    from app.features.entegrasyonlar.outbox_models import EntegrasyonGonderim

    tetkik_rows = session.exec(
        select(Tetkik.durum, func.count())
        .select_from(Tetkik)
        .group_by(Tetkik.durum)
    ).all()
    tetkik_durumlari = [
        AnalyticsDagilim(etiket=str(durum or "BILINMIYOR"), deger=int(cnt))
        for durum, cnt in tetkik_rows
    ]

    renk_sayim: dict[str, int] = {r.value: 0 for r in TriyajRenk}
    triyaj_rows = session.exec(
        select(AcilTriyajKaydi.renk, func.count())
        .select_from(AcilTriyajKaydi)
        .group_by(AcilTriyajKaydi.renk)
    ).all()
    for renk, cnt in triyaj_rows:
        renk_sayim[str(renk)] = int(cnt)
    triyaj_renkleri = [
        AnalyticsDagilim(etiket=k, deger=v) for k, v in renk_sayim.items() if v > 0
    ]

    yatak_dolu = int(
        session.exec(
            select(func.count())
            .select_from(Yatak)
            .where(Yatak.durum == YatakDurumu.DOLU)
        ).one()
        or 0
    )
    yatak_bos = int(
        session.exec(
            select(func.count())
            .select_from(Yatak)
            .where(Yatak.durum == YatakDurumu.BOS)
        ).one()
        or 0
    )
    no_show = int(
        session.exec(
            select(func.count())
            .select_from(Hasta)
            .where(Hasta.gelmeyen_randevu_sayisi > 0)
        ).one()
        or 0
    )
    outbox_hata = int(
        session.exec(
            select(func.count())
            .select_from(EntegrasyonGonderim)
            .where(EntegrasyonGonderim.durum == "HATA")
        ).one()
        or 0
    )
    return AnalyticsOzet(
        tetkik_durumlari=tetkik_durumlari,
        triyaj_renkleri=triyaj_renkleri,
        yatak_dolu=yatak_dolu,
        yatak_bos=yatak_bos,
        no_show_hasta=no_show,
        outbox_hata=outbox_hata,
    )
