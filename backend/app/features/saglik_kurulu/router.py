from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.lookups import doktor_getir
from app.core.pagination import Page, PaginationParams, get_pagination, make_page, paginate
from app.core.permissions import Kapsam
from app.core.public_id import (
    optional_hasta_pk_from_public_id,
    optional_hasta_public_id_from_pk,
)
from app.core.security import require_permission
from app.features.kullanicilar.models import Kullanici
from app.features.saglik_kurulu.models import SaglikKuruluKaydi, SaglikKuruluUye

router = APIRouter()


class SaglikKuruluCreate(BaseModel):
    baslik: str = Field(min_length=1, max_length=255)
    hasta_id: UUID | None = None
    karar_ozeti: str | None = None
    uye_doktor_idler: list[int] = Field(default_factory=list)


class SaglikKuruluRead(BaseModel):
    id: int
    baslik: str
    hasta_id: UUID | None
    karar_ozeti: str | None
    durum: str
    uye_doktor_idler: list[int]

    model_config = {"from_attributes": True}


def _to_read(session: Session, row: SaglikKuruluKaydi) -> SaglikKuruluRead:
    uyeler = session.exec(
        select(SaglikKuruluUye.doktor_id).where(SaglikKuruluUye.kurul_id == row.id)
    ).all()
    return SaglikKuruluRead(
        id=row.id,
        baslik=row.baslik,
        hasta_id=optional_hasta_public_id_from_pk(session, row.hasta_id),
        karar_ozeti=row.karar_ozeti,
        durum=row.durum,
        uye_doktor_idler=list(uyeler),
    )


@router.get("/", response_model=Page[SaglikKuruluRead])
def list_kurullar(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination),
    session: Session = Depends(get_session),
    current_user: Kullanici = Depends(require_permission("saglik_kurulu:goruntule")),
):
    kapsam = request.state.kapsam
    if kapsam == Kapsam.GLOBAL:
        q = select(SaglikKuruluKaydi).order_by(SaglikKuruluKaydi.id.desc())
    elif kapsam == Kapsam.KENDI_KAYDIM:
        doktor = doktor_getir(session, current_user.id)
        q = (
            select(SaglikKuruluKaydi)
            .join(SaglikKuruluUye, SaglikKuruluUye.kurul_id == SaglikKuruluKaydi.id)
            .where(SaglikKuruluUye.doktor_id == doktor.id)
            .order_by(SaglikKuruluKaydi.id.desc())
        )
    else:
        raise HTTPException(status_code=403, detail="Sağlık kurulu görüntüleme yetkiniz yok")

    rows, total = paginate(
        session, q, page=pagination.page, page_size=pagination.page_size
    )
    return make_page(
        [_to_read(session, r) for r in rows],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.post("/", response_model=SaglikKuruluRead, status_code=status.HTTP_201_CREATED)
def create_kurul(
    body: SaglikKuruluCreate,
    session: Session = Depends(get_session),
    _user: Kullanici = Depends(require_permission("saglik_kurulu:yonet")),
):
    row = SaglikKuruluKaydi(
        baslik=body.baslik,
        hasta_id=optional_hasta_pk_from_public_id(session, body.hasta_id),
        karar_ozeti=body.karar_ozeti,
        durum="ACIK",
    )
    session.add(row)
    session.flush()
    for did in body.uye_doktor_idler:
        session.add(SaglikKuruluUye(kurul_id=row.id, doktor_id=did))
    session.commit()
    session.refresh(row)
    return _to_read(session, row)
