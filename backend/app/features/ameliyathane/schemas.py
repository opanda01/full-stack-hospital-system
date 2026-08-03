from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AmeliyathaneOku(BaseModel):
    id: int
    ad: str
    oda_no: str
    durum: str

    model_config = {"from_attributes": True}


class AmeliyathaneGuncelle(BaseModel):
    ad: str | None = Field(default=None, max_length=150)
    oda_no: str | None = Field(default=None, max_length=30)
    durum: str | None = None


class AmeliyatEkipUyeCreate(BaseModel):
    personel_id: int
    rol: str


class AmeliyatEkipUyeOku(BaseModel):
    id: int
    personel_id: int
    rol: str

    model_config = {"from_attributes": True}


class AmeliyatPlaniOlustur(BaseModel):
    hasta_id: UUID
    ameliyathane_id: int
    sorumlu_cerrah_id: int
    planlanan_baslangic: datetime
    planlanan_sure_dk: int = Field(ge=15, le=24 * 60)
    ameliyat_adi: str = Field(max_length=300)
    ekip: list[AmeliyatEkipUyeCreate] = Field(default_factory=list)


class AmeliyatPlaniGuncelle(BaseModel):
    ameliyathane_id: int | None = None
    planlanan_baslangic: datetime | None = None
    planlanan_sure_dk: int | None = Field(default=None, ge=15, le=24 * 60)
    ameliyat_adi: str | None = Field(default=None, max_length=300)
    durum: str | None = None


class AmeliyatPlaniOku(BaseModel):
    id: int
    hasta_id: UUID
    ameliyathane_id: int
    sorumlu_cerrah_id: int
    planlanan_baslangic: datetime
    planlanan_sure_dk: int
    gercek_baslangic: datetime | None = None
    gercek_bitis: datetime | None = None
    durum: str
    ameliyat_adi: str
    iptal_gerekcesi: str | None = None
    ekip: list[AmeliyatEkipUyeOku] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class AmeliyatIptal(BaseModel):
    gerekce: str = Field(max_length=1000)


class AnesteziKaydiOlustur(BaseModel):
    anestezi_tipi: str
    asa_skoru: int = Field(ge=1, le=5)
    anestezist_id: int
    notlar: str | None = Field(default=None, max_length=2000)


class AnesteziKaydiOku(BaseModel):
    id: int
    ameliyat_plani_id: int
    anestezi_tipi: str
    asa_skoru: int
    anestezist_id: int
    notlar: str | None = None

    model_config = {"from_attributes": True}


class AmeliyathaneTakvimOgesi(BaseModel):
    ameliyat_plani_id: int
    ameliyat_adi: str
    hasta_id: UUID
    planlanan_baslangic: datetime
    planlanan_sure_dk: int
    durum: str
    sorumlu_cerrah_id: int


class AmeliyathaneTakvim(BaseModel):
    ameliyathane_id: int
    gun: date
    ogeler: list[AmeliyathaneTakvimOgesi]


class PostOpYatakOnerisi(BaseModel):
    ameliyat_plani_id: int
    onerilen_yataklar: list[dict]
