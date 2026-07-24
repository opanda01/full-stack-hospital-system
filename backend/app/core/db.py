from collections.abc import Generator

from sqlalchemy import text
from sqlmodel import Session, create_engine

from app.core.config import get_settings

settings = get_settings()

_kwargs: dict = {"echo": False, "pool_pre_ping": True}
if settings.DATABASE_URL.startswith("postgresql"):
    _kwargs.update(
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_recycle=settings.DB_POOL_RECYCLE,
    )

engine = create_engine(settings.DATABASE_URL, **_kwargs)


def bind_audit_actor(session: Session, actor_id: int | None) -> None:
    """SET LOCAL app.actor_id — PgBouncer transaction pooling ile uyumlu."""
    if actor_id is None:
        return
    bind = session.get_bind()
    if bind.dialect.name != "postgresql":
        return
    session.connection().execute(
        text("SELECT set_config('app.actor_id', :v, true)"),
        {"v": str(actor_id)},
    )


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
