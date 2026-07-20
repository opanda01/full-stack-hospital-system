from datetime import date

from pydantic import BaseModel


class TemizlikGoreviCreate(BaseModel):
    personel_id: int
    oda_bolum: str
    gorev_tarihi: date


class TemizlikGoreviRead(BaseModel):
    id: int
    personel_id: int
    oda_bolum: str
    gorev_tarihi: date
    durum: str
    onay_veren_id: int | None = None

    model_config = {"from_attributes": True}


class TemizlikGoreviUpdate(BaseModel):
    durum: str
