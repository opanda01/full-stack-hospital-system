from pydantic import BaseModel, Field


class MobilCihazKayit(BaseModel):
    push_token: str = Field(min_length=10, max_length=512)
    platform: str = Field(default="unknown", max_length=32)
    device_id: str | None = Field(default=None, max_length=128)


class MobilCihazRead(BaseModel):
    id: int
    platform: str
    aktif_mi: bool
