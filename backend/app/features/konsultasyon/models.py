from datetime import datetime
from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel
from app.core.enums import KonsultasyonDurumu


class KonsultasyonIstegi(BaseModel, table=True):
    __tablename__ = "konsultasyon_istekleri"

    isteyen_doktor_id: int = Field(foreign_key="doktorlar.id", index=True)
    hedef_doktor_id: int = Field(foreign_key="doktorlar.id", index=True)
    hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    notlar: Optional[str] = Field(default=None, max_length=2000)
    durum: KonsultasyonDurumu = Field(
        default=KonsultasyonDurumu.BEKLEMEDE, index=True
    )
    yanit_notu: Optional[str] = Field(default=None, max_length=2000)
    yanit_tarihi: Optional[datetime] = Field(default=None)
