from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, col, select

from app.core.db import get_session
from app.core.pagination import Page, PaginationParams, get_pagination, make_page, paginate
from app.core.security import require_permission
from app.features.eczane.models import Ilac

router = APIRouter()


class IlacRead(BaseModel):
    id: int
    ad: str
    barkod: str | None
    stok: int
    kritik_stok: int
    kritik_mi: bool = False

    model_config = {"from_attributes": True}


@router.get("/", response_model=Page[IlacRead])
def list_ilaclar(
    pagination: PaginationParams = Depends(get_pagination),
    session: Session = Depends(get_session),
    _user=Depends(require_permission("eczane:goruntule")),
):
    q = select(Ilac).order_by(col(Ilac.ad).asc(), col(Ilac.id).desc())
    rows, total = paginate(
        session, q, page=pagination.page, page_size=pagination.page_size
    )
    return make_page(
        [
            IlacRead(
                id=r.id,
                ad=r.ad,
                barkod=r.barkod,
                stok=r.stok,
                kritik_stok=r.kritik_stok,
                kritik_mi=r.stok <= r.kritik_stok,
            )
            for r in rows
        ],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )
