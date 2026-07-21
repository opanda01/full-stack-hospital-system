from typing import Any, Optional

from pydantic import BaseModel

from app.core.enums import ImportDurum, YonetimGorevi


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


class PersonelImportBaslatResponse(BaseModel):
    isi_id: int
    celery_task_id: Optional[str] = None
    toplam: int


class PersonelImportDurumResponse(BaseModel):
    id: int
    actor_id: int
    durum: ImportDurum
    toplam: int
    basarili: int
    basarisiz: int
    hata_detay: list[Any] | None = None
    celery_task_id: Optional[str] = None

    model_config = {"from_attributes": True}
