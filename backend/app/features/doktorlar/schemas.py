from pydantic import BaseModel


class DoktorCreate(BaseModel):
    personel_id: int
    uzmanlik_alani: str
    diploma_no: str
    online_randevu_acik_mi: bool = True


class DoktorRead(BaseModel):
    id: int
    personel_id: int
    uzmanlik_alani: str
    diploma_no: str
    online_randevu_acik_mi: bool

    model_config = {"from_attributes": True}


class DoktorUpdate(BaseModel):
    uzmanlik_alani: str | None = None
    diploma_no: str | None = None
    online_randevu_acik_mi: bool | None = None
