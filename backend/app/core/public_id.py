"""Dışa açık UUID kimlik (public_id) yardımcıları.

Integer PK/FK içeride kalır; API sınırında UUID ↔ int çevirisi yapılır.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, TypeVar
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlmodel import Field, Session, SQLModel, select

if TYPE_CHECKING:
    from app.features.hastalar.models import Hasta

T = TypeVar("T", bound=SQLModel)


def new_public_id() -> UUID:
    return uuid4()


def PublicIdField():
    """SQLModel alanı: unique + index, default uuid4 (offline client uyumlu)."""
    return Field(default_factory=uuid4, unique=True, index=True)


def get_by_public_id(session: Session, model: type[T], public_id: UUID) -> T:
    row = session.exec(
        select(model).where(model.public_id == public_id)  # type: ignore[attr-defined]
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    return row


def hasta_from_public_id(session: Session, public_id: UUID) -> Hasta:
    from app.features.hastalar.models import Hasta

    h = session.exec(select(Hasta).where(Hasta.public_id == public_id)).first()
    if h is None:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")
    return h


def hasta_pk_from_public_id(session: Session, public_id: UUID) -> int:
    h = hasta_from_public_id(session, public_id)
    assert h.id is not None
    return h.id


def hasta_public_id_from_pk(session: Session, hasta_id: int) -> UUID:
    from app.features.hastalar.models import Hasta

    h = session.get(Hasta, hasta_id)
    if h is None:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")
    return h.public_id


def optional_hasta_pk_from_public_id(
    session: Session, public_id: UUID | None
) -> int | None:
    if public_id is None:
        return None
    return hasta_pk_from_public_id(session, public_id)


def optional_hasta_public_id_from_pk(
    session: Session, hasta_id: int | None
) -> UUID | None:
    if hasta_id is None:
        return None
    return hasta_public_id_from_pk(session, hasta_id)
