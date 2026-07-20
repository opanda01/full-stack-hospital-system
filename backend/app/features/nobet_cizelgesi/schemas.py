from datetime import date

from pydantic import BaseModel


class NobetCreate(BaseModel):
    personel_id: int
    tarih: date
    vardiya: str
    departman_id: int


class NobetRead(BaseModel):
    id: int
    personel_id: int
    tarih: date
    vardiya: str
    departman_id: int

    model_config = {"from_attributes": True}
