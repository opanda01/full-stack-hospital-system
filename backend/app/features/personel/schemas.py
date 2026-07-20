from pydantic import BaseModel

from app.core.enums import YonetimGorevi


class PersonelCreate(BaseModel):
    kullanici_id: int
    sicil_no: str
    departman_id: int | None = None
    unvan: str | None = None
    amir_id: int | None = None
    yonetim_gorevi: YonetimGorevi = YonetimGorevi.YOK


class PersonelRead(BaseModel):
    id: int
    kullanici_id: int
    sicil_no: str
    departman_id: int | None = None
    unvan: str | None = None
    amir_id: int | None = None
    yonetim_gorevi: YonetimGorevi

    model_config = {"from_attributes": True}


class PersonelUpdate(BaseModel):
    departman_id: int | None = None
    unvan: str | None = None
    amir_id: int | None = None
    yonetim_gorevi: YonetimGorevi | None = None
