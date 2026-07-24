from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.pagination import Page, PaginationParams, get_pagination
from app.core.security import require_permission
from app.features.guvenlik import service as guvenlik_service
from app.features.guvenlik.schemas import (
    DevriyeCreate,
    DevriyeRead,
    DevriyeUpdate,
    GuvenlikOlayCreate,
    GuvenlikOlayRead,
    GuvenlikOlayUpdate,
    GuvenlikOzet,
    KayipEsyaCreate,
    KayipEsyaRead,
    KayipEsyaUpdate,
    RefakatciSorguSonuc,
    ZiyaretciCreate,
    ZiyaretciRead,
    ZiyaretciUpdate,
)
from app.features.kullanicilar.models import Kullanici

router = APIRouter()


@router.get("/ozet", response_model=GuvenlikOzet)
def guvenlik_ozet(
    current_user: Kullanici = Depends(require_permission("guvenlik:ozet")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.ozet(session, current_user)


@router.get("/olaylar", response_model=Page[GuvenlikOlayRead])
def list_olaylar(
    pagination: PaginationParams = Depends(get_pagination),
    _: Kullanici = Depends(require_permission("guvenlik_olay:goruntule")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.olay_listele(
        session, page=pagination.page, page_size=pagination.page_size
    )


@router.post("/olaylar", response_model=GuvenlikOlayRead, status_code=status.HTTP_201_CREATED)
def create_olay(
    body: GuvenlikOlayCreate,
    current_user: Kullanici = Depends(require_permission("guvenlik_olay:olustur")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.olay_olustur(session, current_user, body)


@router.patch("/olaylar/{olay_id}", response_model=GuvenlikOlayRead)
def update_olay(
    olay_id: int,
    body: GuvenlikOlayUpdate,
    _: Kullanici = Depends(require_permission("guvenlik_olay:guncelle")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.olay_guncelle(session, olay_id, body)


@router.get("/ziyaretciler", response_model=Page[ZiyaretciRead])
def list_ziyaretciler(
    sadece_acik: bool = Query(default=False),
    pagination: PaginationParams = Depends(get_pagination),
    _: Kullanici = Depends(require_permission("guvenlik_ziyaretci:goruntule")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.ziyaretci_listele(
        session,
        sadece_acik=sadece_acik,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.post(
    "/ziyaretciler",
    response_model=ZiyaretciRead,
    status_code=status.HTTP_201_CREATED,
)
def create_ziyaretci(
    body: ZiyaretciCreate,
    current_user: Kullanici = Depends(require_permission("guvenlik_ziyaretci:olustur")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.ziyaretci_olustur(session, current_user, body)


@router.patch("/ziyaretciler/{ziyaretci_id}", response_model=ZiyaretciRead)
def update_ziyaretci(
    ziyaretci_id: int,
    body: ZiyaretciUpdate,
    _: Kullanici = Depends(require_permission("guvenlik_ziyaretci:guncelle")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.ziyaretci_guncelle(session, ziyaretci_id, body)


@router.post("/ziyaretciler/{ziyaretci_id}/cikis", response_model=ZiyaretciRead)
def ziyaretci_cikis(
    ziyaretci_id: int,
    _: Kullanici = Depends(require_permission("guvenlik_ziyaretci:guncelle")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.ziyaretci_cikis(session, ziyaretci_id)


@router.get("/kayip-esyalar", response_model=Page[KayipEsyaRead])
def list_kayip_esyalar(
    pagination: PaginationParams = Depends(get_pagination),
    _: Kullanici = Depends(require_permission("kayip_esya:goruntule")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.kayip_esya_listele(
        session, page=pagination.page, page_size=pagination.page_size
    )


@router.post(
    "/kayip-esyalar",
    response_model=KayipEsyaRead,
    status_code=status.HTTP_201_CREATED,
)
def create_kayip_esya(
    body: KayipEsyaCreate,
    current_user: Kullanici = Depends(require_permission("kayip_esya:olustur")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.kayip_esya_olustur(session, current_user, body)


@router.patch("/kayip-esyalar/{esya_id}", response_model=KayipEsyaRead)
def update_kayip_esya(
    esya_id: int,
    body: KayipEsyaUpdate,
    _: Kullanici = Depends(require_permission("kayip_esya:guncelle")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.kayip_esya_guncelle(session, esya_id, body)


@router.get("/devriyeler", response_model=Page[DevriyeRead])
def list_devriyeler(
    pagination: PaginationParams = Depends(get_pagination),
    _: Kullanici = Depends(require_permission("guvenlik_devriye:goruntule")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.devriye_listele(
        session, page=pagination.page, page_size=pagination.page_size
    )


@router.post(
    "/devriyeler",
    response_model=DevriyeRead,
    status_code=status.HTTP_201_CREATED,
)
def create_devriye(
    body: DevriyeCreate,
    current_user: Kullanici = Depends(require_permission("guvenlik_devriye:olustur")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.devriye_olustur(session, current_user, body)


@router.patch("/devriyeler/{devriye_id}", response_model=DevriyeRead)
def update_devriye(
    devriye_id: int,
    body: DevriyeUpdate,
    _: Kullanici = Depends(require_permission("guvenlik_devriye:olustur")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.devriye_guncelle(session, devriye_id, body)


@router.get("/refakatci-sorgula", response_model=list[RefakatciSorguSonuc])
def sorgula_refakatci(
    q: str = Query(min_length=2),
    _: Kullanici = Depends(require_permission("refakatci:sorgula")),
    session: Session = Depends(get_session),
):
    return guvenlik_service.refakatci_sorgula(session, q)
