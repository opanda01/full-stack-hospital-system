import hashlib
import json
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
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
    idempotency_key: str | None = Field(default=None, max_length=128)


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
    idempotency_key: str | None = None

    model_config = {"from_attributes": True}


def _payload_hash(departman_id: int, doktor_id: int | None, tarih: date, slot_sayisi: int) -> str:
    raw = json.dumps(
        {
            "departman_id": departman_id,
            "doktor_id": doktor_id,
            "tarih": tarih.isoformat(),
            "slot_sayisi": slot_sayisi,
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _default_idem_key(departman_id: int, doktor_id: int | None, tarih: date) -> str:
    d = doktor_id if doktor_id is not None else "none"
    return f"mhrs:{departman_id}:{d}:{tarih.isoformat()}:create"


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
    key = body.idempotency_key or _default_idem_key(
        body.departman_id, body.doktor_id, body.tarih
    )
    ph = _payload_hash(body.departman_id, body.doktor_id, body.tarih, body.slot_sayisi)

    existing = session.exec(
        select(MhrsKapasite).where(MhrsKapasite.idempotency_key == key)
    ).first()
    if existing is not None:
        if existing.payload_hash == ph:
            return existing
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Aynı idempotency_key farklı payload ile daha önce kullanıldı",
        )

    row = MhrsKapasite(
        departman_id=body.departman_id,
        doktor_id=body.doktor_id,
        tarih=body.tarih,
        slot_sayisi=body.slot_sayisi,
        kaynak="MOCK",
        idempotency_key=key,
        payload_hash=ph,
    )
    session.add(row)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        existing = session.exec(
            select(MhrsKapasite).where(MhrsKapasite.idempotency_key == key)
        ).first()
        if existing is not None and existing.payload_hash == ph:
            return existing
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Kapasite kaydı çakışması (unique departman/doktor/tarih veya key)",
        ) from exc
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
    row.payload_hash = _payload_hash(
        row.departman_id, row.doktor_id, row.tarih, row.slot_sayisi
    )
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
    row.son_senkron = datetime.now(timezone.utc)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row
