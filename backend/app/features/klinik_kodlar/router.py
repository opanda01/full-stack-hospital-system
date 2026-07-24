from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.security import require_permission
from app.features.klinik_kodlar.models import Icd10Kodu

router = APIRouter()


class Icd10Read(BaseModel):
    kod: str
    aciklama: str

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[Icd10Read])
def search_icd10(
    q: str | None = Query(default=None),
    session: Session = Depends(get_session),
    _user=Depends(require_permission("muayene:goruntule")),
):
    query = select(Icd10Kodu).order_by(Icd10Kodu.kod).limit(50)
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = (
            select(Icd10Kodu)
            .where(
                (Icd10Kodu.kod.ilike(like)) | (Icd10Kodu.aciklama.ilike(like))
            )
            .order_by(Icd10Kodu.kod)
            .limit(50)
        )
    return list(session.exec(query).all())
