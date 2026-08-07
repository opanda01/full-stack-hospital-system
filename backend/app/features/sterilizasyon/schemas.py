from datetime import date

from pydantic import BaseModel, Field


class CihazCreate(BaseModel):
    ad: str = Field(max_length=150)
    envanter_no: str = Field(max_length=64)
    son_sterilizasyon: date | None = None
    sonraki_kalibrasyon: date | None = None
    notlar: str | None = Field(default=None, max_length=500)


class CihazRead(BaseModel):
    id: int
    ad: str
    envanter_no: str
    son_sterilizasyon: date | None
    sonraki_kalibrasyon: date | None
    durum: str
    notlar: str | None

    model_config = {"from_attributes": True}


class CihazGuncelle(BaseModel):
    son_sterilizasyon: date | None = None
    sonraki_kalibrasyon: date | None = None
    durum: str | None = Field(default=None, max_length=32)
    notlar: str | None = Field(default=None, max_length=500)
