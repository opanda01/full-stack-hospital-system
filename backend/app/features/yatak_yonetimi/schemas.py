from datetime import datetime

from pydantic import BaseModel, Field

from app.core.enums import ServisTipi, YatakDurumu


class ServisOku(BaseModel):
    id: int
    ad: str
    kod: str
    tip: str
    kat_no: int | None
    departman_id: int | None

    model_config = {"from_attributes": True}


class ServisOlustur(BaseModel):
    ad: str = Field(max_length=150)
    kod: str = Field(max_length=50)
    tip: ServisTipi = ServisTipi.DAHILIYE
    kat_no: int | None = None
    departman_id: int | None = None


class ServisGuncelle(BaseModel):
    ad: str | None = Field(default=None, max_length=150)
    kod: str | None = Field(default=None, max_length=50)
    tip: ServisTipi | None = None
    kat_no: int | None = None
    departman_id: int | None = None


class OdaOku(BaseModel):
    id: int
    servis_id: int
    oda_no: str

    model_config = {"from_attributes": True}


class OdaOlustur(BaseModel):
    servis_id: int
    oda_no: str = Field(max_length=30)


class YatakOku(BaseModel):
    id: int
    oda_id: int
    oda_no: str | None = None
    servis_id: int | None = None
    yatak_no: str
    durum: str

    model_config = {"from_attributes": True}


class YatakOlustur(BaseModel):
    oda_id: int
    yatak_no: str = Field(max_length=30)
    durum: YatakDurumu = YatakDurumu.BOS


class YatakGuncelle(BaseModel):
    yatak_no: str | None = Field(default=None, max_length=30)
    durum: YatakDurumu | None = None


class YatakAtaIstek(BaseModel):
    yatis_id: int


class ServisDolulukOzet(BaseModel):
    servis_id: int
    bos: int
    dolu: int
    temizlik_bekliyor: int
    arizali: int
    toplam: int


class YatakGecmisiOku(BaseModel):
    id: int
    yatak_id: int
    hasta_id: int
    giris_zamani: datetime
    cikis_zamani: datetime | None

    model_config = {"from_attributes": True}
