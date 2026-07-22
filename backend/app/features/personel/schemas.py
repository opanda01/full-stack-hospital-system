from typing import Any, Optional

from pydantic import BaseModel, EmailStr, model_validator

from app.core.enums import ImportDurum, Rol, YonetimGorevi


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
    ad: str | None = None
    soyad: str | None = None
    email: str | None = None
    rol: str | None = None
    departman_ad: str | None = None
    aktif_mi: bool | None = None

    model_config = {"from_attributes": True}


class PersonelWithUserCreate(BaseModel):
    """Tek istekte kullanıcı + personel (+ doktor) oluşturma."""

    tc_kimlik_no: str
    ad: str
    soyad: str
    email: EmailStr
    telefon: str | None = None
    sifre: str = "Test1234!"
    rol: Rol
    sicil_no: str
    departman_id: int | None = None
    unvan: str | None = None
    uzmanlik_alani: str | None = None
    diploma_no: str | None = None
    online_randevu_acik_mi: bool = True

    @model_validator(mode="after")
    def personel_rol_ve_doktor(self) -> "PersonelWithUserCreate":
        if self.rol == Rol.HASTA:
            raise ValueError("Hasta kaydı bu uçtan oluşturulamaz")
        if self.rol == Rol.DOKTOR:
            if not self.uzmanlik_alani or not self.diploma_no:
                raise ValueError(
                    "Doktor rolü için uzmanlik_alani ve diploma_no zorunlu"
                )
        return self


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
