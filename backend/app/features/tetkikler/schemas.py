from uuid import UUID

from pydantic import BaseModel


class TetkikCreate(BaseModel):
    hasta_id: UUID
    istek_yapan_doktor_id: int
    tetkik_turu: str
    public_id: UUID | None = None


class TetkikRead(BaseModel):
    id: UUID
    hasta_id: UUID
    istek_yapan_doktor_id: int
    tetkik_turu: str
    sonuc_dosyasi: str | None = None
    durum: str

    model_config = {"from_attributes": True}


class TetkikSonucUpdate(BaseModel):
    sonuc_dosyasi: str
    durum: str = "SONUCLANDI"
