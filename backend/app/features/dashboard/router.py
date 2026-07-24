"""Rol dashboard KPI özetleri — full-list yerine SQL COUNT."""

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, func, select

from app.core.db import get_session
from app.core.enums import IlacTalepDurumu, KlinikOnayDurumu
from app.core.lookups import doktor_getir, personel_getir
from app.core.security import get_current_user, require_permission
from app.features.departmanlar.models import Departman
from app.features.doktorlar.models import Doktor
from app.features.hastalar import service as hasta_service
from app.features.ilac_talep.models import IlacTalebi
from app.features.klinik_onay.models import KlinikOnayKaydi
from app.features.kullanicilar.models import Kullanici
from app.features.nobet_cizelgesi.models import NobetCizelgesi
from app.features.personel.models import Personel
from app.features.randevular.models import Randevu
from app.features.tetkikler.models import Tetkik
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
