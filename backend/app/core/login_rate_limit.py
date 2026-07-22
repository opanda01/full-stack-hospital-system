"""Basit bellek içi login rate limit (tek süreç / geliştirme).

Production'da reverse-proxy / WAF tercih edilir; bu middleware ek koruma sağlar.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import get_settings


class LoginRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next) -> Response:
        settings = get_settings()
        path = request.url.path.rstrip("/")
        if request.method == "POST" and path.endswith("/auth/login"):
            limit = settings.LOGIN_RATE_LIMIT_PER_MINUTE
            if limit > 0:
                ip = request.client.host if request.client else "unknown"
                now = time.monotonic()
                window = self._hits[ip]
                while window and now - window[0] > 60:
                    window.popleft()
                if len(window) >= limit:
                    return JSONResponse(
                        status_code=429,
                        content={
                            "detail": "Çok fazla giriş denemesi. Lütfen bir dakika sonra tekrar deneyin."
                        },
                    )
                window.append(now)
        return await call_next(request)
