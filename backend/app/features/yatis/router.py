from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.yatis import klinik_service
from app.features.yatis import service as yatis_service
from app.features.yatis.schemas import (
    AmeliyatRead,
    BildirimRead,
    DevirNotCreate,
    DevirNotRead,
    GorevCreate,
    GorevRead,
    HastaIslemLogRead,
    HastaNotCreate,
    HastaNotRead,
    IlacUygulamaCreate,
    IlacUygulamaDurumPatch,
    IlacUygulamaListeItem,
    IlacUygulamaRead,
    IzinHareketRead,
    KonsultasyonOzet,
    ServisHareketRead,
    ServisRead,
    VitalCreate,
    VitalRead,
    YatakHareketRead,
    YatakRead,
    YatisDetay,
    YatisIslemRequest,
    YatisListeItem,
)

router = APIRouter()


@router.get("/servisler", response_model=list[ServisRead])
def get_servisler(
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("yatis:goruntule")),
):
    return yatis_service.list_servisler(session)


@router.get("/yataklar", response_model=list[YatakRead])
def get_yataklar(
    servis_id: int | None = None,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("yatis:goruntule")),
):
    return yatis_service.list_yataklar(session, servis_id=servis_id)


@router.get("/kayitlar", response_model=list[YatisListeItem])
def get_kayitlar(
    servis_id: int | None = None,
    doktor_id: int | None = None,
    hemsire_id: int | None = None,
    baslangic: date | None = None,
    bitis: date | None = None,
    aktif: bool | None = Query(default=True),
    kapsam: str | None = Query(default=None),
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("yatis:goruntule")),
):
    return yatis_service.list_kayitlar(
        session,
        servis_id=servis_id,
        doktor_id=doktor_id,
        hemsire_id=hemsire_id,
        baslangic=baslangic,
        bitis=bitis,
        aktif=aktif,
        kapsam=kapsam,
        current_user=current_user,
    )


@router.get("/kayitlar/{yatis_id}", response_model=YatisDetay)
def get_kayit(
    yatis_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("yatis:goruntule")),
):
    return yatis_service.get_detay(session, yatis_id)


@router.get(
    "/kayitlar/{yatis_id}/servis-hareketleri",
    response_model=list[ServisHareketRead],
)
def get_servis_hareketleri(
    yatis_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("yatis:goruntule")),
):
    return yatis_service.list_servis_hareketleri(session, yatis_id)


@router.get(
    "/kayitlar/{yatis_id}/yatak-hareketleri",
    response_model=list[YatakHareketRead],
)
def get_yatak_hareketleri(
    yatis_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("yatis:goruntule")),
):
    return yatis_service.list_yatak_hareketleri(session, yatis_id)


@router.get(
    "/kayitlar/{yatis_id}/izin-hareketleri",
    response_model=list[IzinHareketRead],
)
def get_izin_hareketleri(
    yatis_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("yatis:goruntule")),
):
    return yatis_service.list_izin_hareketleri(session, yatis_id)


@router.get("/kayitlar/{yatis_id}/ameliyatlar", response_model=list[AmeliyatRead])
def get_ameliyatlar(
    yatis_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("yatis:goruntule")),
):
    return yatis_service.list_ameliyatlar(session, yatis_id)


@router.get(
    "/kayitlar/{yatis_id}/konsultasyonlar",
    response_model=list[KonsultasyonOzet],
)
def get_konsultasyonlar(
    yatis_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("yatis:goruntule")),
):
    return yatis_service.list_konsultasyonlar(session, yatis_id)


@router.get(
    "/kayitlar/{yatis_id}/islem-loglari",
    response_model=list[HastaIslemLogRead],
)
def get_islem_loglari(
    yatis_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("yatis:goruntule")),
):
    return yatis_service.list_islem_loglari(session, yatis_id)


@router.post("/kayitlar/{yatis_id}/islemler", response_model=YatisDetay)
def post_islem(
    yatis_id: int,
    body: YatisIslemRequest,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("yatis:islem")),
):
    return yatis_service.uygula_islem(session, yatis_id, body, current_user)


@router.get("/kayitlar/{yatis_id}/vitaller", response_model=list[VitalRead])
def get_vitaller(
    yatis_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("vital:goruntule")),
):
    return klinik_service.list_vitaller(session, yatis_id)


@router.post("/kayitlar/{yatis_id}/vitaller", response_model=VitalRead, status_code=201)
def post_vital(
    yatis_id: int,
    body: VitalCreate,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("vital:olustur")),
):
    return klinik_service.create_vital(
        session, yatis_id, body.model_dump(), current_user
    )


@router.get(
    "/ilac-uygulamalari",
    response_model=list[IlacUygulamaListeItem],
)
def get_ilac_uygulamalari_toplu(
    durum: str | None = Query(default=None),
    kapsam: str | None = Query(default="benim"),
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("ilac_uygulama:goruntule")),
):
    return klinik_service.list_ilac_uygulamalari_toplu(
        session, current_user, durum=durum, kapsam=kapsam
    )


@router.get(
    "/kayitlar/{yatis_id}/ilac-uygulamalari",
    response_model=list[IlacUygulamaRead],
)
def get_ilac_uygulamalari(
    yatis_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("ilac_uygulama:goruntule")),
):
    return klinik_service.list_ilac_uygulamalari(session, yatis_id)


@router.post(
    "/kayitlar/{yatis_id}/ilac-uygulamalari",
    response_model=IlacUygulamaRead,
    status_code=201,
)
def post_ilac_uygulama(
    yatis_id: int,
    body: IlacUygulamaCreate,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("ilac_uygulama:olustur")),
):
    return klinik_service.create_ilac_uygulama(session, yatis_id, body.model_dump())


@router.patch(
    "/ilac-uygulamalari/{uygulama_id}/durum",
    response_model=IlacUygulamaRead,
)
def patch_ilac_uygulama(
    uygulama_id: int,
    body: IlacUygulamaDurumPatch,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("ilac_uygulama:guncelle")),
):
    return klinik_service.patch_ilac_uygulama_durum(
        session, uygulama_id, body.durum, current_user
    )


@router.get("/kayitlar/{yatis_id}/notlar", response_model=list[HastaNotRead])
def get_notlar(
    yatis_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("yatis:goruntule")),
):
    return klinik_service.list_notlar(session, yatis_id)


@router.post(
    "/kayitlar/{yatis_id}/notlar",
    response_model=HastaNotRead,
    status_code=201,
)
def post_not(
    yatis_id: int,
    body: HastaNotCreate,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("yatis:islem")),
):
    return klinik_service.create_not(session, yatis_id, body.metin, current_user)


@router.get("/gorevler", response_model=list[GorevRead])
def get_gorevler(
    tamamlandi: bool | None = None,
    benim: bool = Query(default=True),
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("hemsire_gorev:goruntule")),
):
    hid = None
    if benim:
        hid = klinik_service.personel_id_of(session, current_user)
    return klinik_service.list_gorevler(
        session, hemsire_id=hid, tamamlandi=tamamlandi
    )


@router.post("/gorevler", response_model=GorevRead, status_code=201)
def post_gorev(
    body: GorevCreate,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("hemsire_gorev:olustur")),
):
    return klinik_service.create_gorev(session, body.model_dump(), current_user)


@router.patch("/gorevler/{gorev_id}/toggle", response_model=GorevRead)
def toggle_gorev(
    gorev_id: int,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("hemsire_gorev:guncelle")),
):
    return klinik_service.toggle_gorev(session, gorev_id)


@router.get("/vardiya-devir", response_model=list[DevirNotRead])
def get_devir(
    vardiya_tarihi: date | None = None,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("vardiya_devir:goruntule")),
):
    return klinik_service.list_devir_notlari(session, vardiya_tarihi=vardiya_tarihi)


@router.post("/vardiya-devir", response_model=DevirNotRead, status_code=201)
def post_devir(
    body: DevirNotCreate,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("vardiya_devir:olustur")),
):
    return klinik_service.create_devir_notu(session, body.model_dump(), current_user)


@router.get("/bildirimler", response_model=list[BildirimRead])
def get_bildirimler(
    okunmamis: bool | None = None,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("panel_bildirim:goruntule")),
):
    return klinik_service.list_bildirimler(
        session, current_user.id, okunmamis=okunmamis
    )


@router.patch("/bildirimler/{bildirim_id}/okundu", response_model=BildirimRead)
def patch_bildirim_okundu(
    bildirim_id: int,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("panel_bildirim:guncelle")),
):
    return klinik_service.mark_okundu(session, bildirim_id, current_user.id)
