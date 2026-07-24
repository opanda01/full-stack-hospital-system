from datetime import datetime
from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel


class EntegrasyonGonderim(BaseModel, table=True):
    __tablename__ = "entegrasyon_gonderimleri"

    sistem: str = Field(max_length=40, index=True)
    kaynak: str = Field(max_length=40)
    kaynak_id: str = Field(max_length=64, index=True)
    idempotency_key: str = Field(max_length=128, unique=True, index=True)
    durum: str = Field(default="BEKLEMEDE", max_length=40)
    dis_referans: Optional[str] = Field(default=None, max_length=128)
    son_hata: Optional[str] = Field(default=None, max_length=1000)
    payload_json: Optional[str] = Field(default=None, max_length=8000)
    deneme: int = Field(default=0)
    son_deneme: Optional[datetime] = Field(default=None)
