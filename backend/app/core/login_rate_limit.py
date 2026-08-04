"""Login / OTP IP rate limit — Redis (paylaşımlı) veya bellek içi fallback."""

from __future__ import annotations

import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import get_settings

_local_hits: dict[str, deque[float]] = defaultdict(deque)

_RATE_LIMITED_SUFFIXES = (
    "/auth/login",
    "/auth/otp/gonder",
    "/auth/otp/dogrula",
)


def _redis_allow(ip: str, limit: int, *, bucket: str) -> bool:
    try:
        from app.core.cache import _client

        r = _client()
        if r is None:
            return True
        key = f"{bucket}_rl:{ip}"
        n = r.incr(key)
        if n == 1:
            r.expire(key, 60)
        return n <= limit
    except Exception:
        return True


def _memory_allow(ip: str, limit: int, *, bucket: str) -> bool:
    now = time.monotonic()
    key = f"{bucket}:{ip}"
    window = _local_hits[key]
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= limit:
        return False
    window.append(now)
    return True


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


class LoginRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        settings = get_settings()
        path = request.url.path.rstrip("/")
        if request.method == "POST" and any(
            path.endswith(suf) for suf in _RATE_LIMITED_SUFFIXES
        ):
            limit = settings.LOGIN_RATE_LIMIT_PER_MINUTE
            if limit > 0:
                ip = _client_ip(request)
                bucket = "otp" if "/otp/" in path else "login"
                try:
                    from app.core.cache import _client

                    if _client() is not None:
                        allowed = _redis_allow(ip, limit, bucket=bucket)
                    else:
                        allowed = _memory_allow(ip, limit, bucket=bucket)
                except Exception:
                    allowed = _memory_allow(ip, limit, bucket=bucket)
                if not allowed:
                    return JSONResponse(
                        status_code=429,
                        content={
                            "detail": (
                                "Çok fazla deneme. Lütfen bir dakika sonra tekrar deneyin."
                            )
                        },
                    )
        return await call_next(request)
