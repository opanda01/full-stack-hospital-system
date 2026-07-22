from datetime import datetime
from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel
from app.core.enums import EntegrasyonDurumKod, EntegrasyonSistem


class EntegrasyonDurum(BaseModel, table=True):
    __tablename__ = "entegrasyon_durumlari"

    sistem: EntegrasyonSistem = Field(unique=True, max_length=40)
    durum: EntegrasyonDurumKod = Field(default=EntegrasyonDurumKod.BILINMIYOR)
    son_senkron: Optional[datetime] = Field(default=None)
    hata_ozeti: Optional[str] = Field(default=None, max_length=1000)
