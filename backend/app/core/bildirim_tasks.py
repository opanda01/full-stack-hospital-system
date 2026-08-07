"""Celery: bildirim DLQ işleme."""

from sqlmodel import Session

from app.core.bildirim_dlq import isle_bekleyenler
from app.core.celery_app import celery_app
from app.core.db import engine


@celery_app.task(name="bildirim.dlq_isle")
def bildirim_dlq_isle(limit: int = 20) -> dict:
    with Session(engine) as session:
        n = isle_bekleyenler(session, limit=limit)
    return {"islenen": n}
