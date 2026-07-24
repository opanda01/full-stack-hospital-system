from typing import Optional

from sqlmodel import Field

from app.core.base_model import BaseModel
from app.core.enums import AlerjiSiddet, AllerjenTipi


class HastaAlerjisi(BaseModel, table=True):
    __tablename__ = "hasta_alerjileri"

    hasta_id: int = Field(foreign_key="hastalar.id", index=True)
    allerjen_tipi: AllerjenTipi = Field(max_length=40)
    allerjen_kodu: Optional[str] = Field(default=None, max_length=64)
    allerjen_adi: str = Field(max_length=200)
    siddet: AlerjiSiddet = Field(default=AlerjiSiddet.HAFIF, max_length=40)
    notlar: Optional[str] = Field(default=None, max_length=1000)
    silindi_mi: bool = Field(default=False, index=True)
