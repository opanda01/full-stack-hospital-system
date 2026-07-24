from uuid import UUID

from pydantic import BaseModel, Field


class TetkikCreate(BaseModel):
    hasta_id: UUID
    istek_yapan_doktor_id: int
    tetkik_turu: str
    public_id: UUID | None = None


class TetkikSonucKalemRead(BaseModel):
    id: int
    parametre_adi: str
    loinc_kodu: str | None = None
    deger_sayisal: float | None = None
    deger_metin: str | None = None
    birim: str | None = None
    ref_min: float | None = None
    ref_max: float | None = None
    anormal_mi: bool = False

    model_config = {"from_attributes": True}


class TetkikSonucKalemCreate(BaseModel):
    parametre_adi: str = Field(min_length=1, max_length=150)
    loinc_kodu: str | None = None
    deger_sayisal: float | None = None
    deger_metin: str | None = None
    birim: str | None = None
    ref_min: float | None = None
    ref_max: float | None = None
    anormal_mi: bool = False


class TetkikRead(BaseModel):
    id: UUID
    hasta_id: UUID
    istek_yapan_doktor_id: int
    tetkik_turu: str
    sonuc_dosyasi: str | None = None
    durum: str
    sonuc_kalemleri: list[TetkikSonucKalemRead] = []

    model_config = {"from_attributes": True}


class TetkikSonucUpdate(BaseModel):
    sonuc_dosyasi: str | None = None
    durum: str = "SONUCLANDI"
    sonuc_kalemleri: list[TetkikSonucKalemCreate] | None = None


class TetkikTrendNokta(BaseModel):
    tetkik_id: UUID
    tarih: str | None = None
    deger_sayisal: float | None = None
    deger_metin: str | None = None
    birim: str | None = None
    anormal_mi: bool = False
