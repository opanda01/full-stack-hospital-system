#!/bin/sh
set -e
cd /app
echo "[entrypoint] alembic upgrade head..."
/opt/venv/bin/alembic upgrade head
echo "[entrypoint] demo kullanicilar (idempotent)..."
/opt/venv/bin/python -m app.core.seed_rbac
echo "[entrypoint] hastane referans (birim / poliklinik / doktor)..."
/opt/venv/bin/python -m app.core.seed_hastane
echo "[entrypoint] toplu test personel (rol basina 50, idempotent)..."
/opt/venv/bin/python -m app.core.seed_personel_toplu --per-rol 50
echo "[entrypoint] starting: $*"
exec "$@"
