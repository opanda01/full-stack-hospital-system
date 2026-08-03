"""Orthanc REST istemcisi."""

from __future__ import annotations

from typing import Any

import httpx
from fastapi import HTTPException

from app.core.config import get_settings


def _base_url() -> str:
    return get_settings().ORTHANC_URL.rstrip("/")


def _auth() -> tuple[str, str]:
    s = get_settings()
    return s.ORTHANC_USER, s.ORTHANC_PASSWORD


def orthanc_health() -> dict[str, Any]:
    """Orthanc /system yanıtı; erişilemezse HTTPException."""
    try:
        with httpx.Client(timeout=10.0) as client:
            r = client.get(f"{_base_url()}/system", auth=_auth())
            r.raise_for_status()
            return r.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Orthanc erişilemiyor: {e}",
        ) from e


def orthanc_studies_getir(study_instance_uid: str) -> dict[str, Any]:
    """StudyInstanceUID ile Orthanc study meta verisi."""
    try:
        with httpx.Client(timeout=15.0) as client:
            find = client.post(
                f"{_base_url()}/tools/find",
                auth=_auth(),
                json={
                    "Level": "Study",
                    "Query": {"StudyInstanceUID": study_instance_uid},
                },
            )
            find.raise_for_status()
            orthanc_ids: list[str] = find.json()
            if not orthanc_ids:
                raise HTTPException(
                    status_code=404,
                    detail="Orthanc'ta study bulunamadı",
                )
            study_id = orthanc_ids[0]
            detail = client.get(
                f"{_base_url()}/studies/{study_id}",
                auth=_auth(),
            )
            detail.raise_for_status()
            meta = detail.json()
            meta["OrthancStudyId"] = study_id
            return meta
    except HTTPException:
        raise
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Orthanc isteği başarısız: {e}",
        ) from e


def orthanc_viewer_url(study_instance_uid: str) -> str:
    """Orthanc gömülü web viewer (yeni sekme)."""
    base = _base_url()
    return (
        f"{base}/ui/app/#/viewer?"
        f"StudyInstanceUIDs={study_instance_uid}"
    )
