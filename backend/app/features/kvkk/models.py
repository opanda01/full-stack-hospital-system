from datetime import datetime
from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel
from app.core.enums import KvkkMetinTur, KvkkOnayKanal


class KvkkMetni(BaseModel, table=True):
    __tablename__ = "kvkk_metinleri"

    tur: KvkkMetinTur = Field(max_length=40, index=True)
    versiyon: str = Field(max_length=40)
    baslik: str = Field(max_length=200)
    govde: str = Field(max_length=20000)
    yururluk_tarihi: datetime = Field(default_factory=datetime.utcnow)
    aktif_mi: bool = Field(default=True, index=True)


class KvkkOnayKaydi(BaseModel, table=True):
    __tablename__ = "kvkk_onay_kayitlari"

    kullanici_id: int = Field(foreign_key="kullanicilar.id", index=True)
    metin_id: int = Field(foreign_key="kvkk_metinleri.id", index=True)
    onay_tarihi: datetime = Field(default_factory=datetime.utcnow)
    ip: Optional[str] = Field(default=None, max_length=64)
    kanal: KvkkOnayKanal = Field(default=KvkkOnayKanal.WEB, max_length=40)
    # Reşit olmayan / ehliyeti kısıtlı hasta için yasal temsilci onamı
    yasal_temsilci_id: Optional[int] = Field(
        default=None, foreign_key="hasta_yasal_temsilciler.id", index=True
    )
    temsilci_ad_soyad: Optional[str] = Field(default=None, max_length=200)
    temsilci_tc_kimlik_no: Optional[str] = Field(default=None, max_length=11)
    temsilci_tur: Optional[str] = Field(default=None, max_length=30)
