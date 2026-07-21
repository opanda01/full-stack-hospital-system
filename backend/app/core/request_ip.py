"""İstemci IP çözümleme — X-Forwarded-For yalnızca güvenilir proxy'den."""

from fastapi import Request

from app.core.config import get_settings


def istemci_ip_al(request: Request) -> str | None:
    client_host = request.client.host if request.client else None
    trusted = get_settings().trusted_proxy_ip_set

    if client_host and client_host in trusted:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            # Sol/ilk hop (orijinal istemci, reverse proxy zincirinde)
            first = xff.split(",")[0].strip()
            if first:
                return first

    return client_host
