from decimal import Decimal
from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel


class Fatura(BaseModel, table=True):
    __tablename__ = "faturalar"

    hasta_id: Optional[int] = Field(default=None, foreign_key="hastalar.id")
    tutar: Decimal = Field(default=Decimal("0"), max_digits=12, decimal_places=2)
    durum: str = Field(default="TASLAK", max_length=30)
    aciklama: Optional[str] = Field(default=None, max_length=500)
    medula_takip_no: Optional[str] = Field(default=None, max_length=64)
    provizyon_no: Optional[str] = Field(default=None, max_length=64)
    gonderim_durumu: Optional[str] = Field(default="BEKLEMEDE", max_length=40)
