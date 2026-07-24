from pydantic import BaseModel, Field

from app.core.enums import AlerjiSiddet, AllerjenTipi


class ReceteKalemCreate(BaseModel):
    ilac_id: int | None = None
    urun_adi: str = Field(min_length=1, max_length=200)
    barkod: str | None = None
    doz: str | None = None
    periyod: str | None = None
    kullanim_sekli: str | None = None
    adet: int | None = Field(default=None, ge=1)
    sira: int = Field(default=1, ge=1)


class ReceteKalemRead(BaseModel):
    id: int
    muayene_id: int
    ilac_id: int | None = None
    urun_adi: str
    barkod: str | None = None
    doz: str | None = None
    periyod: str | None = None
    kullanim_sekli: str | None = None
    adet: int | None = None
    sira: int

    model_config = {"from_attributes": True}


class UyariOnay(BaseModel):
    gerekce: str = Field(min_length=10, max_length=2000)
    uyari_kodlari: list[str] = Field(min_length=1)


class MuayeneCreate(BaseModel):
    randevu_id: int
    tani: str | None = None
    tedavi_plani: str | None = None
    receteler: str | None = None  # deprecated
    recete_kalemleri: list[ReceteKalemCreate] | None = None
    uyari_onay: UyariOnay | None = None


class MuayeneUpdate(BaseModel):
    tani: str | None = None
    tedavi_plani: str | None = None
    receteler: str | None = None  # deprecated
    recete_kalemleri: list[ReceteKalemCreate] | None = None
    uyari_onay: UyariOnay | None = None


class MuayeneRead(BaseModel):
    id: int
    randevu_id: int
    tani: str | None = None
    tedavi_plani: str | None = None
    receteler: str | None = None
    recete_kalemleri: list[ReceteKalemRead] = []

    model_config = {"from_attributes": True}


class HastaAlerjiCreate(BaseModel):
    allerjen_tipi: AllerjenTipi
    allerjen_kodu: str | None = None
    allerjen_adi: str = Field(min_length=1, max_length=200)
    siddet: AlerjiSiddet = AlerjiSiddet.HAFIF
    notlar: str | None = None


class HastaAlerjiRead(BaseModel):
    id: int
    hasta_id: int
    allerjen_tipi: str
    allerjen_kodu: str | None = None
    allerjen_adi: str
    siddet: str
    notlar: str | None = None

    model_config = {"from_attributes": True}
