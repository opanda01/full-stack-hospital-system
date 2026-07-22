from decimal import Decimal
from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel


class DonerSermayeKayit(BaseModel, table=True):
    __tablename__ = "doner_sermaye_kayitlari"

    donem: str = Field(max_length=20)
    gelir: Decimal = Field(default=Decimal("0"), max_digits=14, decimal_places=2)
    gider: Decimal = Field(default=Decimal("0"), max_digits=14, decimal_places=2)
    aciklama: Optional[str] = Field(default=None, max_length=500)
