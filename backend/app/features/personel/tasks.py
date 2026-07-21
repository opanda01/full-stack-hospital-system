"""Celery task: personel toplu import."""

from __future__ import annotations

from sqlmodel import Session

from app.core.celery_app import celery_app
from app.core.db import engine
from app.features.personel import import_service


@celery_app.task(name="personel.import_isle")
def personel_import_isle(isi_id: int, rows: list[dict[str, str]]) -> dict:
    with Session(engine) as session:
        import_service.run_import_job(session, isi_id, rows)
    return {"isi_id": isi_id, "toplam": len(rows)}
