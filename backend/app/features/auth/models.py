from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Column, DateTime, JSON
from sqlmodel import Field, SQLModel

from app.core.base_model import BaseModel, utc_now
from app.core.enums import ImportDurum, OtpAmac


class RefreshToken(SQLModel, table=True):
    """Opak refresh token — hash ile saklanır, revoke edilebilir."""

    __tablename__ = "refresh_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    kullanici_id: int = Field(foreign_key="kullanicilar.id", index=True)
    token_hash: str = Field(max_length=64, unique=True, index=True)
    olusturma_tarihi: datetime = Field(default_factory=utc_now)
    son_kullanma_tarihi: datetime
    iptal_edildi_mi: bool = Field(default=False)
    oturum_tipi: str = Field(default="personel", max_length=20)


class OtpKodu(SQLModel, table=True):
    __tablename__ = "otp_kodlari"

    id: Optional[int] = Field(default=None, primary_key=True)
    telefon: str = Field(max_length=20, index=True)
    tc_kimlik_no: str = Field(max_length=11, index=True)
    kod_hash: str = Field(max_length=64)
    amac: OtpAmac = Field(index=True)
    deneme_sayisi: int = Field(default=0)
    son_kullanma: datetime
    kullanildi_mi: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utc_now)


class PersonelImportIsi(BaseModel, table=True):
    __tablename__ = "personel_import_isleri"

    actor_id: int = Field(foreign_key="kullanicilar.id", index=True)
    durum: ImportDurum = Field(default=ImportDurum.BEKLEMEDE, index=True)
    toplam: int = Field(default=0)
    basarili: int = Field(default=0)
    basarisiz: int = Field(default=0)
    hata_detay: Optional[list[Any]] = Field(default=None, sa_column=Column(JSON))
    celery_task_id: Optional[str] = Field(default=None, max_length=255)


class DenetimKaydi(SQLModel, table=True):
    __tablename__ = "denetim_kayitlari"

    # ORM: tek PK (SQLite test uyumu). Postgres partition PK (id, zaman) migration'da.
    id: Optional[int] = Field(default=None, primary_key=True)
    actor_id: Optional[int] = Field(default=None, foreign_key="kullanicilar.id", index=True)
    aksiyon: str = Field(max_length=100, index=True)
    kaynak: Optional[str] = Field(default=None, max_length=100)
    kaynak_id: Optional[str] = Field(default=None, max_length=100)
    ip_adresi: Optional[str] = Field(default=None, max_length=64)
    detay: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    zaman: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True),
    )
