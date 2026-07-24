from datetime import date, datetime
from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel


class MhrsKapasite(BaseModel, table=True):
    __tablename__ = "mhrs_kapasiteler"

    departman_id: int = Field(foreign_key="departmanlar.id", index=True)
    doktor_id: Optional[int] = Field(default=None, foreign_key="doktorlar.id")
    tarih: date = Field(index=True)
    slot_sayisi: int = Field(default=16)
    kaynak: str = Field(default="MOCK", max_length=20)
    son_senkron: Optional[datetime] = Field(default=None)
    idempotency_key: Optional[str] = Field(
        default=None, max_length=128, unique=True, index=True
    )
    payload_hash: Optional[str] = Field(default=None, max_length=64)
