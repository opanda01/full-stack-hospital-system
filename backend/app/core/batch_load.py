"""Toplu id → entity yükleme (N+1 önleme)."""

from collections.abc import Iterable
from typing import TypeVar

from sqlmodel import Session, SQLModel, select

T = TypeVar("T", bound=SQLModel)


def batch_by_ids(
    session: Session,
    model: type[T],
    ids: Iterable[int | None],
) -> dict[int, T]:
    """Tek SELECT ... WHERE id IN (...) ile dict[id, row] döner.

    Boş / None id set'inde sorgu atılmaz.
    """
    unique = {i for i in ids if i is not None}
    if not unique:
        return {}
    rows = session.exec(select(model).where(model.id.in_(unique))).all()  # type: ignore[attr-defined]
    return {row.id: row for row in rows if row.id is not None}
