from datetime import datetime
from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel


class YetkiDevriKaydi(BaseModel, table=True):
    __tablename__ = "yetki_devri_kayitlari"

    veren_id: int = Field(foreign_key="kullanicilar.id")
    alan_personel_id: int = Field(foreign_key="personel.id")
    baslangic: datetime
    bitis: datetime
    izin_kodlari: Optional[str] = Field(default=None, max_length=2000)
    duyuru_metni: str = Field(max_length=4000)
    aktif_mi: bool = Field(default=True)
