from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.pagination import Page, PaginationParams, get_pagination
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.sikayet_oneri import service as sikayet_service
from app.features.sikayet_oneri.schemas import (
    SikayetKaynak,
    SikayetOneriCreate,
    SikayetOneriRead,
    SikayetOzet,
    SikayetDurumGuncelle,
    SikayetSiralama,
)

router = APIRouter()


@router.get("/", response_model=Page[SikayetOneriRead])
def list_sikayet_oneri(
    pagination: PaginationParams = Depends(get_pagination),
    siralama: SikayetSiralama = Query(default=SikayetSiralama.YENI_ONCE),
    kaynak: SikayetKaynak | None = Query(default=None),
    tur: str | None = Query(default=None, description="SIKAYET veya ONERI"),
    durum: str | None = Query(default=None),
    tarih_baslangic: datetime | None = Query(default=None),
    tarih_bitis: datetime | None = Query(default=None),
    session: Session = Depends(get_session),
    _user=Depends(require_permission("sikayet_oneri:tumunu_goruntule")),
):
    return sikayet_service.list_sikayetler(
        session,
        siralama=siralama,
        kaynak=kaynak,
        tur=tur,
        durum=durum,
        tarih_baslangic=tarih_baslangic,
        tarih_bitis=tarih_bitis,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get("/ozet", response_model=SikayetOzet)
def get_sikayet_ozet(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("sikayet_oneri:tumunu_goruntule")),
):
    return sikayet_service.get_ozet(session)


@router.post("/", response_model=SikayetOneriRead, status_code=status.HTTP_201_CREATED)
def create_sikayet_oneri(
    body: SikayetOneriCreate,
    current_user: Kullanici = Depends(require_permission("sikayet_oneri:gonder")),
    session: Session = Depends(get_session),
):
    return sikayet_service.create_sikayet(session, current_user, body)


@router.get("/benim", response_model=Page[SikayetOneriRead])
def list_benim_sikayetler(
    pagination: PaginationParams = Depends(get_pagination),
    current_user: Kullanici = Depends(require_permission("sikayet_oneri:benim")),
    session: Session = Depends(get_session),
):
    return sikayet_service.list_benim_sikayetler(
        session,
        current_user,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.patch("/{sikayet_id}/durum", response_model=SikayetOneriRead)
def update_sikayet_durum(
    sikayet_id: int,
    body: SikayetDurumGuncelle,
    current_user: Kullanici = Depends(require_permission("sikayet_oneri:durum_guncelle")),
    session: Session = Depends(get_session),
):
    return sikayet_service.update_durum(session, sikayet_id, body, current_user)
