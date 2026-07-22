from sqlmodel import Field

from app.core.base_model import BaseModel


class Ilac(BaseModel, table=True):
    __tablename__ = "ilaclar"

    ad: str = Field(max_length=200)
    barkod: str | None = Field(default=None, max_length=64)
    stok: int = Field(default=0)
    kritik_stok: int = Field(default=10)
