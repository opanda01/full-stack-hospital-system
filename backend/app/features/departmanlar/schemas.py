from pydantic import BaseModel


class BirimCreate(BaseModel):
    ad: str
    kod: str | None = None
    sira: int = 0
    aciklama: str | None = None


class BirimUpdate(BaseModel):
    ad: str | None = None
    kod: str | None = None
    sira: int | None = None
    aciklama: str | None = None


class BirimRead(BaseModel):
    id: int
    ad: str
    kod: str | None = None
    sira: int = 0
    aciklama: str | None = None

    model_config = {"from_attributes": True}


class DepartmanCreate(BaseModel):
    ad: str
    birim_id: int | None = None
    kategori: str | None = None
    aciklama: str | None = None
    kat_no: int | None = None


class DepartmanRead(BaseModel):
    id: int
    ad: str
    birim_id: int | None = None
    birim_ad: str | None = None
    kategori: str | None = None
    aciklama: str | None = None
    kat_no: int | None = None

    model_config = {"from_attributes": True}


class DepartmanUpdate(BaseModel):
    ad: str | None = None
    birim_id: int | None = None
    kategori: str | None = None
    aciklama: str | None = None
    kat_no: int | None = None
