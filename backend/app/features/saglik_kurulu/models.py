from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel


class SaglikKuruluKaydi(BaseModel, table=True):
    __tablename__ = "saglik_kurulu_kayitlari"

    baslik: str = Field(max_length=255)
    hasta_id: Optional[int] = Field(default=None, foreign_key="hastalar.id", index=True)
    karar_ozeti: Optional[str] = Field(default=None, max_length=4000)
    durum: str = Field(default="ACIK", max_length=30, index=True)


class SaglikKuruluUye(BaseModel, table=True):
    __tablename__ = "saglik_kurulu_uyeleri"

    kurul_id: int = Field(foreign_key="saglik_kurulu_kayitlari.id", index=True)
    doktor_id: int = Field(foreign_key="doktorlar.id", index=True)
