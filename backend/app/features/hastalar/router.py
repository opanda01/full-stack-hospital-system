from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from sqlmodel import Session

from app.core.db import get_session
from app.core.enums import Rol
from app.core.lookups import hasta_getir
from app.core.pagination import Page, PaginationParams, get_pagination
from app.core.security import get_current_user, require_permission, require_role
from app.features.bashekim.router import phi_goruntuleme_logla
from app.features.hastalar import service as hasta_service
from app.features.hastalar import alerji_service
from app.features.hastalar.schemas import (
    HastaCreateWithUser,
    HastaProfilUpdate,
    HastaRead,
    HastaUpdate,
)
from app.features.kullanicilar.models import Kullanici
from app.features.muayeneler.schemas import HastaAlerjiCreate, HastaAlerjiRead

router = APIRouter()


@router.get("/ben", response_model=HastaRead)
def benim_hasta_kaydim(
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(get_current_user),
):
    h = hasta_getir(session, current_user.id)
    return hasta_service._hasta_to_read(session, h)


@router.patch("/ben", response_model=HastaRead)
def benim_profili_guncelle(
    body: HastaProfilUpdate,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_role(Rol.HASTA)),
):
    """Hasta boy, kilo, kan grubu vb. kendi bilgilerini günceller."""
    h = hasta_service.update_benim_profil(session, current_user, body)
    return hasta_service._hasta_to_read(session, h)


@router.get("/ben/alerjiler", response_model=list[HastaAlerjiRead])
def benim_alerjilerim(
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(get_current_user),
):
    """Hasta kendi alerji kayıtlarını okur (hasta:goruntule gerekmez)."""
    from sqlmodel import select

    from app.features.hastalar.alerji_models import HastaAlerjisi

    h = hasta_getir(session, current_user.id)
    assert h.id is not None
    rows = session.exec(
        select(HastaAlerjisi).where(
            HastaAlerjisi.hasta_id == h.id,
            HastaAlerjisi.silindi_mi == False,  # noqa: E712
        )
    ).all()
    return [
        HastaAlerjiRead(
            id=r.id,  # type: ignore[arg-type]
            hasta_id=r.hasta_id,
            allerjen_tipi=r.allerjen_tipi,
            allerjen_kodu=r.allerjen_kodu,
            allerjen_adi=r.allerjen_adi,
            siddet=r.siddet,
            notlar=r.notlar,
        )
        for r in rows
    ]


@router.get("/benim", response_model=Page[HastaRead])
def list_benim_hastalar(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination),
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("hasta:goruntule")),
):
    return hasta_service.list_benim_hastalar(
        session,
        current_user,
        request.state.kapsam,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get("/", response_model=Page[HastaRead])
def list_hastalar(
    q: str | None = None,
    kapsam: str | None = None,
    pagination: PaginationParams = Depends(get_pagination),
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(
        require_role(
            Rol.ADMIN,
            Rol.BASHEKIM,
            Rol.MUDUR,
            Rol.HEMSIRE,
            Rol.EBE,
            Rol.IDARI_PERSONEL,
        )
    ),
):
    if q or kapsam:
        return hasta_service.search_hastalar(
            session,
            current_user,
            q=q,
            kapsam_filtre=kapsam,
            page=pagination.page,
            page_size=pagination.page_size,
        )
    return hasta_service.list_hastalar(
        session, page=pagination.page, page_size=pagination.page_size
    )


@router.get("/{public_id}/alerjiler", response_model=list[HastaAlerjiRead])
def list_alerjiler(
    public_id: UUID,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("hasta:goruntule")),
):
    return alerji_service.list_alerjiler(
        session, current_user, public_id, request.state.kapsam
    )


@router.post(
    "/{public_id}/alerjiler",
    response_model=HastaAlerjiRead,
    status_code=status.HTTP_201_CREATED,
)
def create_alerji(
    public_id: UUID,
    body: HastaAlerjiCreate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("hasta:guncelle")),
):
    return alerji_service.create_alerji(
        session, current_user, public_id, body, request.state.kapsam
    )


@router.delete("/{public_id}/alerjiler/{alerji_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alerji(
    public_id: UUID,
    alerji_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("hasta:guncelle")),
):
    alerji_service.soft_delete_alerji(
        session, current_user, public_id, alerji_id, request.state.kapsam
    )


@router.get("/{public_id}", response_model=HastaRead)
def get_hasta(
    public_id: UUID,
    request: Request,
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("hasta:goruntule")),
):
    hasta = hasta_service.get_hasta_scoped(
        session, current_user, public_id, request.state.kapsam
    )
    h = hasta_service.get_hasta_by_public_id(session, public_id)
    phi_goruntuleme_logla(
        session,
        actor=current_user,
        kaynak="hasta",
        kaynak_id=h.id,
        request=request,
        detay_extra={"hasta_public_id": str(h.public_id)},
    )
    return hasta


@router.post("/", response_model=HastaRead, status_code=status.HTTP_201_CREATED)
def create_hasta(
    body: HastaCreateWithUser,
    session: Session = Depends(get_session),
    _user=Depends(require_role(Rol.ADMIN, Rol.IDARI_PERSONEL)),
):
    h = hasta_service.create_hasta_with_user(session, body)
    return hasta_service._hasta_to_read(session, h)


@router.patch("/{public_id}", response_model=HastaRead)
def update_hasta(
    public_id: UUID,
    body: HastaUpdate,
    session: Session = Depends(get_session),
    _user=Depends(require_role(Rol.ADMIN, Rol.IDARI_PERSONEL)),
):
    h = hasta_service.update_hasta(session, public_id, body)
    return hasta_service._hasta_to_read(session, h)
