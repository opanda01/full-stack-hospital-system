from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, String
from sqlmodel import Field

from app.core.base_model import BaseModel, utc_now
from app.core.enums import (
    RadyolojiAciliyet,
    RadyolojiIstemDurumu,
    RadyolojiTetkikTuru,
)


class RadyolojiIstemi(BaseModel, table=True):
    __tablename__ = "radyoloji_istemleri"

    hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    isteyen_doktor_id: int = Field(foreign_key="doktorlar.id", index=True)
    muayene_id: Optional[int] = Field(
        default=None, foreign_key="muayene_kayitlari.id", index=True
    )
    tetkik_turu: RadyolojiTetkikTuru = Field(
        sa_column=Column(String(30), nullable=False, index=True),
    )
    vucut_bolgesi: str = Field(max_length=150)
    aciliyet: RadyolojiAciliyet = Field(
        default=RadyolojiAciliyet.RUTIN,
        sa_column=Column(String(20), nullable=False, index=True),
    )
    durum: RadyolojiIstemDurumu = Field(
        default=RadyolojiIstemDurumu.ISTENDI,
        sa_column=Column(String(30), nullable=False, index=True),
    )
    istem_zamani: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True),
    )


class RadyolojiSonucu(BaseModel, table=True):
    __tablename__ = "radyoloji_sonuclari"

    istem_id: int = Field(
        foreign_key="radyoloji_istemleri.id", unique=True, index=True
    )
    orthanc_study_instance_uid: str = Field(max_length=128, index=True)
    orthanc_series_instance_uid: Optional[str] = Field(
        default=None, max_length=128, index=True
    )
    raporlayan_radyolog_id: int = Field(foreign_key="doktorlar.id", index=True)
    rapor_metni: str = Field(max_length=8000)
    rapor_zamani: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True),
    )
