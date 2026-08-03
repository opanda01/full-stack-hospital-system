from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String
from sqlmodel import Field

from app.core.base_model import BaseModel, utc_now
from app.core.enums import ServisTipi, YatakDurumu


class Servis(BaseModel, table=True):
    __tablename__ = "servisler"

    ad: str = Field(max_length=150, index=True)
    kod: str = Field(max_length=50, unique=True, index=True)
    tip: ServisTipi = Field(
        default=ServisTipi.DAHILIYE,
        sa_column=Column(String(30), nullable=False, index=True),
    )
    kat_no: Optional[int] = Field(default=None)
    departman_id: Optional[int] = Field(
        default=None, foreign_key="departmanlar.id", index=True
    )


class Oda(BaseModel, table=True):
    __tablename__ = "odalar"

    servis_id: int = Field(foreign_key="servisler.id", index=True)
    oda_no: str = Field(max_length=30, index=True)


class Yatak(BaseModel, table=True):
    __tablename__ = "yataklar"

    oda_id: int = Field(foreign_key="odalar.id", index=True)
    yatak_no: str = Field(max_length=30)
    durum: YatakDurumu = Field(
        default=YatakDurumu.BOS,
        sa_column=Column(String(30), nullable=False, index=True),
    )


class YatakGecmisi(BaseModel, table=True):
    __tablename__ = "yatak_gecmisi"

    yatak_id: int = Field(foreign_key="yataklar.id", index=True)
    hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    giris_zamani: datetime = Field(default_factory=utc_now, index=True)
    cikis_zamani: Optional[datetime] = Field(default=None, index=True)
