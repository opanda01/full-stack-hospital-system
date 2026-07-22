from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.security import require_permission
from app.features.mhrs.models import MhrsKapasite

router = APIRouter()


class MhrsKapasiteCreate(BaseModel):
    departman_id: int
    doktor_id: int | None = None
    tarih: date
    slot_sayisi: int = Field(default=16, ge=1, le=200)


class MhrsKapasiteUpdate(BaseModel):
    slot_sayisi: int | None = Field(default=None, ge=1, le=200)
    doktor_id: int | None = None


class MhrsKapasiteRead(BaseModel):
    id: int
    departman_id: int
    doktor_id: int | None
    tarih: date
    slot_sayisi: int
    kaynak: str
    son_senkron: datetime | None

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[MhrsKapasiteRead])
def list_kapasite(
    session: Session = Depends(get_session),
    _user=Depends(require_permission("mhrs:yonet")),
):
    return list(session.exec(select(MhrsKapasite).order_by(MhrsKapasite.tarih)).all())


@router.post("/", response_model=MhrsKapasiteRead, status_code=status.HTTP_201_CREATED)
def create_kapasite(
    body: MhrsKapasiteCreate,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("mhrs:yonet")),
):
    row = MhrsKapasite(**body.model_dump(), kaynak="MOCK")
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.patch("/{kapasite_id}", response_model=MhrsKapasiteRead)
def update_kapasite(
    kapasite_id: int,
    body: MhrsKapasiteUpdate,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("mhrs:yonet")),
):
    row = session.get(MhrsKapasite, kapasite_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Kapasite bulunamadı")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.post("/{kapasite_id}/senkron", response_model=MhrsKapasiteRead)
def senkron_kapasite(
    kapasite_id: int,
    session: Session = Depends(get_session),
    _user=Depends(require_permission("mhrs:yonet")),
):
    """Mock MHRS senkron — lokal kaydı 'gönderildi' işaretler."""
    row = session.get(MhrsKapasite, kapasite_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Kapasite bulunamadı")
    row.kaynak = "MHRS"
    row.son_senkron = datetime.utcnow()
    session.add(row)
    session.commit()
    session.refresh(row)
    return row
