"""Paylaşımlı JSON cache — Redis (db/2), yoksa process-local fallback."""

from __future__ import annotations

import json
import time
from typing import Any

from app.core.config import get_settings

_local: dict[str, tuple[float, str]] = {}
_redis = None
_redis_failed = False


def _client():
    global _redis, _redis_failed
    if _redis_failed:
        return None
    if _redis is not None:
        return _redis
    settings = get_settings()
    url = getattr(settings, "REDIS_CACHE_URL", None) or ""
    if not url:
        # Celery broker host, db 2
        broker = settings.CELERY_BROKER_URL or ""
        if broker.startswith("redis://"):
            # redis://host:6379/0 -> .../2
            base = broker.rsplit("/", 1)[0]
            url = f"{base}/2"
        else:
            _redis_failed = True
            return None
    try:
        import redis

        _redis = redis.Redis.from_url(url, decode_responses=True, socket_connect_timeout=0.5)
        _redis.ping()
        return _redis
    except Exception:
        _redis_failed = True
        _redis = None
        return None


def get_json(key: str) -> Any | None:
    r = _client()
    if r is not None:
        try:
            raw = r.get(key)
            if raw is None:
                return None
            return json.loads(raw)
        except Exception:
            pass
    item = _local.get(key)
    if item is None:
        return None
    exp, raw = item
    if time.time() > exp:
        _local.pop(key, None)
        return None
    return json.loads(raw)


def set_json(key: str, value: Any, ttl_sec: int = 45) -> None:
    raw = json.dumps(value, default=str)
    r = _client()
    if r is not None:
        try:
            r.setex(key, ttl_sec, raw)
            return
        except Exception:
            pass
    _local[key] = (time.time() + ttl_sec, raw)


def invalidate(key: str) -> None:
    r = _client()
    if r is not None:
        try:
            r.delete(key)
        except Exception:
            pass
    _local.pop(key, None)
