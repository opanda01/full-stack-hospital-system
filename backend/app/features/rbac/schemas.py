from pydantic import BaseModel


class RolRead(BaseModel):
    id: int
    kod: str
    ad: str
    aciklama: str | None = None
    sistem_mi: bool

    model_config = {"from_attributes": True}


class IzinRead(BaseModel):
    id: int
    kod: str
    ad: str
    kaynak: str

    model_config = {"from_attributes": True}


class RolIzinDetay(BaseModel):
    kod: str
    kapsam: str


class RolIzinlerUpdate(BaseModel):
    """Eski şema — PUT artık desteklenmiyor."""

    izin_kodlari: list[str]
