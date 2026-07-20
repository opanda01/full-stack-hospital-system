from pydantic import BaseModel


class DepartmanCreate(BaseModel):
    ad: str
    kategori: str | None = None
    aciklama: str | None = None
    kat_no: int | None = None


class DepartmanRead(BaseModel):
    id: int
    ad: str
    kategori: str | None = None
    aciklama: str | None = None
    kat_no: int | None = None

    model_config = {"from_attributes": True}


class DepartmanUpdate(BaseModel):
    ad: str | None = None
    kategori: str | None = None
    aciklama: str | None = None
    kat_no: int | None = None
