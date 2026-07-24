"""Ortak page/page_size pagination — OFFSET + COUNT, id tie-breaker çağıranda."""

from typing import Any, Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlmodel import Session, select

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=200)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


def get_pagination(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)


def paginate(
    session: Session,
    statement: Any,
    *,
    page: int,
    page_size: int,
) -> tuple[list[Any], int]:
    """Filtrelenmiş statement için COUNT + LIMIT/OFFSET.

    Caller ORDER BY ... , id DESC tie-breaker eklemeli.
    """
    count_stmt = select(func.count()).select_from(
        statement.order_by(None).subquery()
    )
    total_raw = session.exec(count_stmt).one()
    total = int(total_raw[0] if isinstance(total_raw, tuple) else total_raw or 0)
    offset = (page - 1) * page_size
    rows = list(session.exec(statement.offset(offset).limit(page_size)).all())
    return rows, total


def make_page(
    items: list[T],
    *,
    total: int,
    page: int,
    page_size: int,
) -> Page[T]:
    return Page(items=items, total=total, page=page, page_size=page_size)
