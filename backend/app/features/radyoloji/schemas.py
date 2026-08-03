from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RadyolojiIstemOlustur(BaseModel):
    hasta_id: UUID
    isteyen_doktor_id: int
    muayene_id: int | None = None
    tetkik_turu: str
    vucut_bolgesi: str = Field(max_length=150)
    aciliyet: str = "RUTIN"


class RadyolojiIstemOku(BaseModel):
    id: int
    hasta_id: UUID
    hasta_ad_soyad: str | None = None
    isteyen_doktor_id: int
    isteyen_doktor_ad_soyad: str | None = None
    muayene_id: int | None = None
    tetkik_turu: str
    vucut_bolgesi: str
    aciliyet: str
    durum: str
    istem_zamani: datetime
    sonuc: "RadyolojiSonucOku | None" = None

    model_config = {"from_attributes": True}


class RadyolojiSonucOku(BaseModel):
    id: int
    istem_id: int
    orthanc_study_instance_uid: str
    orthanc_series_instance_uid: str | None = None
    raporlayan_radyolog_id: int
    rapor_metni: str
    rapor_zamani: datetime

    model_config = {"from_attributes": True}


class RadyolojiRaporGir(BaseModel):
    rapor_metni: str = Field(min_length=1, max_length=8000)
    orthanc_study_instance_uid: str = Field(min_length=1, max_length=128)
    orthanc_series_instance_uid: str | None = Field(default=None, max_length=128)
    raporlayan_radyolog_id: int | None = None


class RadyolojiGoruntuLink(BaseModel):
    istem_id: int
    study_instance_uid: str | None = None
    viewer_url: str | None = None
    orthanc_meta: dict | None = None
