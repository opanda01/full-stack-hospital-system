"""PHI encryption (AES-256-GCM) + blind index (HMAC-SHA256)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
from functools import lru_cache

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import get_settings


def _b64e(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64d(data: str) -> bytes:
    pad = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)


def _key_bytes(raw: str) -> bytes:
    raw = raw.strip()
    if not raw:
        raise ValueError("empty key")
    try:
        b = _b64d(raw)
        if len(b) >= 16:
            return b if len(b) == 32 else hashlib.sha256(b).digest()
    except Exception:
        pass
    return hashlib.sha256(raw.encode("utf-8")).digest()


def _parse_keys_map(raw_json: str, single: str, version: int) -> dict[int, bytes]:
    out: dict[int, bytes] = {}
    raw_json = (raw_json or "").strip()
    if raw_json:
        data = json.loads(raw_json)
        for k, v in data.items():
            out[int(k)] = _key_bytes(str(v))
    if single.strip():
        out[version] = _key_bytes(single)
    return out


@lru_cache
def _enc_keys() -> dict[int, bytes]:
    s = get_settings()
    return _parse_keys_map(
        s.PHI_ENCRYPTION_KEYS, s.PHI_ENCRYPTION_KEY, s.PHI_ENCRYPTION_KEY_VERSION
    )


@lru_cache
def _hmac_keys() -> dict[int, bytes]:
    s = get_settings()
    return _parse_keys_map(s.PHI_HMAC_KEYS, s.PHI_HMAC_KEY, s.PHI_HMAC_KEY_VERSION)


def phi_encrypt_enabled() -> bool:
    return bool(get_settings().PHI_ENCRYPT_ENABLED)


def encrypt_phi(plaintext: str | None) -> str | None:
    if plaintext is None:
        return None
    if not phi_encrypt_enabled():
        return plaintext
    keys = _enc_keys()
    ver = get_settings().PHI_ENCRYPTION_KEY_VERSION
    key = keys.get(ver)
    if key is None:
        raise RuntimeError(f"PHI encryption key version {ver} missing")
    nonce = os.urandom(12)
    ct = AESGCM(key).encrypt(nonce, plaintext.encode("utf-8"), None)
    return f"v{ver}:{_b64e(nonce + ct)}"


def decrypt_phi(ciphertext: str | None) -> str | None:
    if ciphertext is None:
        return None
    if not ciphertext.startswith("v") or ":" not in ciphertext:
        return ciphertext
    ver_s, payload = ciphertext.split(":", 1)
    ver = int(ver_s[1:])
    key = _enc_keys().get(ver)
    if key is None:
        raise RuntimeError(f"PHI encryption key version {ver} missing")
    raw = _b64d(payload)
    nonce, ct = raw[:12], raw[12:]
    return AESGCM(key).decrypt(nonce, ct, None).decode("utf-8")


def hmac_tc(tc: str, *, version: int | None = None) -> str:
    s = get_settings()
    ver = version if version is not None else s.PHI_HMAC_KEY_VERSION
    keys = _hmac_keys()
    key = keys.get(ver) or hashlib.sha256(f"dev-hmac-{ver}".encode()).digest()
    return _b64e(hmac.new(key, tc.encode("utf-8"), hashlib.sha256).digest())


def hmac_lookup_values(tc: str) -> list[str]:
    s = get_settings()
    keys = _hmac_keys()
    versions = sorted(keys.keys(), reverse=True) or [s.PHI_HMAC_KEY_VERSION]
    return [hmac_tc(tc, version=v) for v in versions]


def clear_crypto_caches() -> None:
    _enc_keys.cache_clear()
    _hmac_keys.cache_clear()
