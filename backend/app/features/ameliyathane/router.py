from datetime import date

from fastapi import APIRouter, Depends, Query, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.pagination import Page, PaginationParams, get_pagination
from app.core.permissions import Kapsam
from app.core.security import require_permission
from app.features.ameliyathane import service as ameliyat_service
from app.features.ameliyathane.schemas import (
    AmeliyathaneGuncelle,
    AmeliyathaneOku,
    AmeliyathaneTakvim,
    AmeliyatIptal,
    AmeliyatPlaniGuncelle,
    AmeliyatPlaniOku,
    AmeliyatPlaniOlustur,
    AnesteziKaydiOlustur,
    AnesteziKaydiOku,
    PostOpYatakOnerisi,
)
from app.features.kullanicilar.models import Kullanici

router = APIRouter()


@router.get("/ameliyathaneler", response_model=list[AmeliyathaneOku])
def get_ameliyathaneler(
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("ameliyat:goruntule")),
):
    return ameliyat_service.list_ameliyathaneler(session)


@router.patch("/ameliyathaneler/{ameliyathane_id}", response_model=AmeliyathaneOku)
def patch_ameliyathane(
    ameliyathane_id: int,
    body: AmeliyathaneGuncelle,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("ameliyat:guncelle")),
):
    return ameliyat_service.guncelle_ameliyathane(session, ameliyathane_id, body)


@router.get(
    "/ameliyathaneler/{ameliyathane_id}/takvim",
    response_model=AmeliyathaneTakvim,
)
def get_ameliyathane_takvim(
    ameliyathane_id: int,
    request: Request,
    gun: date = Query(..., description="Takvim günü (YYYY-MM-DD)"),
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("ameliyat:goruntule")),
):
    kapsam: Kapsam = request.state.kapsam
    return ameliyat_service.ameliyathane_takvim(
        session,
        ameliyathane_id,
        gun,
        kapsam=kapsam,
        current_user=current_user,
    )


@router.get("/ameliyatlar", response_model=Page[AmeliyatPlaniOku])
def list_ameliyatlar(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination),
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("ameliyat:goruntule")),
):
    kapsam: Kapsam = request.state.kapsam
    return ameliyat_service.list_ameliyat_planlari(
        session,
        kapsam=kapsam,
        current_user=current_user,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get("/ameliyatlar/{plan_id}", response_model=AmeliyatPlaniOku)
def get_ameliyat(
    plan_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("ameliyat:goruntule")),
):
    kapsam: Kapsam = request.state.kapsam
    return ameliyat_service.get_ameliyat_plani(
        session, plan_id, kapsam=kapsam, current_user=current_user
    )


@router.post(
    "/ameliyatlar",
    response_model=AmeliyatPlaniOku,
    status_code=status.HTTP_201_CREATED,
)
def post_ameliyat_planla(
    body: AmeliyatPlaniOlustur,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("ameliyat:planla")),
):
    kapsam: Kapsam = request.state.kapsam
    return ameliyat_service.ameliyat_planla(
        session, body, kapsam=kapsam, current_user=current_user
    )


@router.patch("/ameliyatlar/{plan_id}", response_model=AmeliyatPlaniOku)
def patch_ameliyat(
    plan_id: int,
    body: AmeliyatPlaniGuncelle,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("ameliyat:guncelle")),
):
    kapsam: Kapsam = request.state.kapsam
    return ameliyat_service.guncelle_ameliyat_plani(
        session, plan_id, body, kapsam=kapsam, current_user=current_user
    )


@router.post("/ameliyatlar/{plan_id}/baslat", response_model=AmeliyatPlaniOku)
def post_ameliyat_baslat(
    plan_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("ameliyat:guncelle")),
):
    kapsam: Kapsam = request.state.kapsam
    return ameliyat_service.ameliyat_baslat(
        session, plan_id, kapsam=kapsam, current_user=current_user
    )


@router.post("/ameliyatlar/{plan_id}/tamamla", response_model=AmeliyatPlaniOku)
def post_ameliyat_tamamla(
    plan_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("ameliyat:guncelle")),
):
    kapsam: Kapsam = request.state.kapsam
    return ameliyat_service.ameliyat_tamamla(
        session, plan_id, kapsam=kapsam, current_user=current_user
    )


@router.post("/ameliyatlar/{plan_id}/iptal", response_model=AmeliyatPlaniOku)
def post_ameliyat_iptal(
    plan_id: int,
    body: AmeliyatIptal,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("ameliyat:iptal_et")),
):
    kapsam: Kapsam = request.state.kapsam
    return ameliyat_service.ameliyat_iptal(
        session, plan_id, body, kapsam=kapsam, current_user=current_user
    )


@router.post(
    "/ameliyatlar/{plan_id}/anestezi",
    response_model=AnesteziKaydiOku,
    status_code=status.HTTP_201_CREATED,
)
def post_anestezi_kaydi(
    plan_id: int,
    body: AnesteziKaydiOlustur,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("anestezi:kaydet")),
):
    kapsam: Kapsam = request.state.kapsam
    return ameliyat_service.kaydet_anestezi(
        session, plan_id, body, kapsam=kapsam, current_user=current_user
    )


@router.get(
    "/ameliyatlar/{plan_id}/post-op-yatak-onerisi",
    response_model=PostOpYatakOnerisi,
)
def get_post_op_yatak(
    plan_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("ameliyat:goruntule")),
):
    kapsam: Kapsam = request.state.kapsam
    return ameliyat_service.post_op_yatak_onerisi(
        session, plan_id, kapsam=kapsam, current_user=current_user
    )
