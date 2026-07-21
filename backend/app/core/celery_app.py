"""Celery uygulama örneği — task'lar feature paketlerinde tanımlanır."""

from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "hastane",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.features.personel.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)
