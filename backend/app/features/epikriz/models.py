from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String
from sqlmodel import Field

from app.core.base_model import BaseModel


class Epikriz(BaseModel, table=True):
    __tablename__ = "epikrizler"

    yatis_id: int = Field(foreign_key="yatis_kayitlari.id", index=True)
    hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    yazar_id: int = Field(foreign_key="kullanicilar.id", index=True)
    durum: str = Field(
        default="TASLAK",
        sa_column=Column(String(30), nullable=False, index=True),
    )
    sikayet_oyku: Optional[str] = Field(default=None, max_length=4000)
    fizik_muayene: Optional[str] = Field(default=None, max_length=4000)
    tani: Optional[str] = Field(default=None, max_length=2000)
    tedavi_ozeti: Optional[str] = Field(default=None, max_length=4000)
    taburcu_onerileri: Optional[str] = Field(default=None, max_length=2000)
    onaylayan_doktor_id: Optional[int] = Field(
        default=None, foreign_key="doktorlar.id", index=True
    )
    onaylandi_at: Optional[datetime] = Field(default=None)
