"""MPI / mükerrer hasta merge istekleri."""

from datetime import datetime
from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel


class HastaMukerrerIstegi(BaseModel, table=True):
    __tablename__ = "hasta_mukerrer_istekleri"

    kaynak_hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    hedef_hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    durum: str = Field(default="BEKLEMEDE", max_length=30, index=True)
    gerekce: str = Field(max_length=1000)
    olusturan_id: int = Field(foreign_key="kullanicilar.id", index=True)
    onaylayan_id: Optional[int] = Field(default=None, foreign_key="kullanicilar.id")
    karar_tarihi: Optional[datetime] = Field(default=None)
