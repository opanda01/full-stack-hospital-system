"""Kapsam bazlı query filtreleme yardımcıları."""

from collections.abc import Callable
from typing import Any, TypeVar

from fastapi import HTTPException, status

from app.core.permissions import Kapsam

Q = TypeVar("Q")


def kullanici_kapsamli_filtre_uygula(
    query: Q,
    kapsam: Kapsam,
    kendi_kaydim_filtresi: Callable[[Q], Q],
    departmanim_filtresi: Callable[[Q], Q] | None = None,
) -> Q:
    if kapsam == Kapsam.GLOBAL:
        return query
    if kapsam == Kapsam.KENDI_KAYDIM:
        return kendi_kaydim_filtresi(query)
    if kapsam == Kapsam.DEPARTMANIM:
        if departmanim_filtresi is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Departman kapsamı bu işlem için tanımlı değil",
            )
        return departmanim_filtresi(query)
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Geçersiz kapsam",
    )
