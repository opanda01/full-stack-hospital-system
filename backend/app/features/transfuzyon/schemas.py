from datetime import datetime

from pydantic import BaseModel, Field


class TransfuzyonCreate(BaseModel):
    yatis_id: int
    verilen_kan_grubu: str = Field(max_length=8)
    uygulama_zamani: datetime | None = None
    ikinci_imza_kullanici_id: int | None = None
    notlar: str | None = Field(default=None, max_length=500)


class TransfuzyonRead(BaseModel):
    id: int
    yatis_id: int
    hasta_id: int
    verilen_kan_grubu: str
    hasta_kan_grubu: str
    uyumlu_mi: bool
    birinci_imza_kullanici_id: int
    ikinci_imza_kullanici_id: int | None
    uygulama_zamani: datetime
    notlar: str | None

    model_config = {"from_attributes": True}
