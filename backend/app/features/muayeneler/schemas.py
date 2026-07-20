from pydantic import BaseModel


class MuayeneCreate(BaseModel):
    randevu_id: int
    tani: str | None = None
    tedavi_plani: str | None = None
    receteler: str | None = None


class MuayeneRead(BaseModel):
    id: int
    randevu_id: int
    tani: str | None = None
    tedavi_plani: str | None = None
    receteler: str | None = None

    model_config = {"from_attributes": True}
