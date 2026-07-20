from datetime import datetime

from pydantic import BaseModel


class SikayetOneriCreate(BaseModel):
    gonderen_kullanici_id: int
    tur: str
    icerik: str


class SikayetOneriRead(BaseModel):
    id: int
    gonderen_kullanici_id: int
    tur: str
    icerik: str
    tarih: datetime
    durum: str

    model_config = {"from_attributes": True}
