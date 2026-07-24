"""Entegrasyon factory."""

from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings
from app.integrations import live_clients, mock_clients
from app.integrations.ports import EnabizPort, KpsPort, MedulaPort


@lru_cache
def get_enabiz() -> EnabizPort:
    if get_settings().ENTEGRASYON_BACKEND == "live":
        return live_clients.LiveEnabiz()
    return mock_clients.MockEnabiz()


@lru_cache
def get_medula() -> MedulaPort:
    if get_settings().ENTEGRASYON_BACKEND == "live":
        return live_clients.LiveMedula()
    return mock_clients.MockMedula()


@lru_cache
def get_kps() -> KpsPort:
    if get_settings().ENTEGRASYON_BACKEND == "live":
        return live_clients.LiveKps()
    return mock_clients.MockKps()
