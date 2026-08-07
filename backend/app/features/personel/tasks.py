"""Celery task: personel toplu import."""

from __future__ import annotations

from sqlmodel import Session

from app.core.celery_app import celery_app
from app.core.db import engine
from app.features.personel import import_service


@celery_app.task(name="personel.import_isle")
def personel_import_isle(
    isi_id: int, rows: list[dict[str, str]], row_offset: int = 2
) -> dict:
    from app.core.config import get_settings

    batch = get_settings().PERSONEL_IMPORT_BATCH_SIZE
    chunk = rows[:batch]
    rest = rows[batch:]
    with Session(engine) as session:
        import_service.run_import_job(
            session,
            isi_id,
            chunk,
            row_offset=row_offset,
            finalize=not rest,
        )
    if rest:
        personel_import_isle.delay(isi_id, rest, row_offset=row_offset + len(chunk))
    return {"isi_id": isi_id, "toplam": len(rows)}
