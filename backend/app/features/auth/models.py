from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel

from app.core.base_model import utc_now


class RefreshToken(SQLModel, table=True):
    """Opak refresh token — hash ile saklanır, revoke edilebilir."""

    __tablename__ = "refresh_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    kullanici_id: int = Field(foreign_key="kullanicilar.id", index=True)
    token_hash: str = Field(max_length=64, unique=True, index=True)
    olusturma_tarihi: datetime = Field(default_factory=utc_now)
    son_kullanma_tarihi: datetime
    iptal_edildi_mi: bool = Field(default=False)
