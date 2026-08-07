#!/bin/sh
set -e
cd /app
echo "[entrypoint] alembic upgrade head..."
/opt/venv/bin/alembic upgrade head
echo "[entrypoint] demo kullanicilar (idempotent)..."
/opt/venv/bin/python -m app.core.seed_rbac
echo "[entrypoint] hastane referans (birim / poliklinik / doktor)..."
/opt/venv/bin/python -m app.core.seed_hastane
echo "[entrypoint] starting: $*"
exec "$@"
