from datetime import datetime
from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel
from app.core.enums import KlinikOnayDurumu


class KlinikOnayKaydi(BaseModel, table=True):
    __tablename__ = "klinik_onay_kayitlari"

    tur: str = Field(max_length=20, index=True)  # RECETE | SEVK | TIBBI_RAPOR
    muayene_id: Optional[int] = Field(default=None, foreign_key="muayene_kayitlari.id")
    hasta_id: Optional[int] = Field(default=None, foreign_key="hastalar.id")
    icerik: str = Field(max_length=4000)
    onay_durumu: KlinikOnayDurumu = Field(
        default=KlinikOnayDurumu.BEKLEMEDE, index=True
    )
    olusturan_id: Optional[int] = Field(default=None)
    onaylayan_id: Optional[int] = Field(default=None)
    onay_tarihi: Optional[datetime] = Field(default=None)
