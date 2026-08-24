#!/bin/sh
set -e
cd /app
echo "[entrypoint] alembic upgrade head..."
/opt/venv/bin/alembic upgrade head
echo "[entrypoint] demo kullanicilar (idempotent)..."
/opt/venv/bin/python -m app.core.seed_rbac
echo "[entrypoint] hastane referans (birim / poliklinik / doktor)..."
/opt/venv/bin/python -m app.core.seed_hastane
echo "[entrypoint] ornek islemler (hasta / randevu)..."
/opt/venv/bin/python -m app.core.seed_ornek_islemler
echo "[entrypoint] toplu test personel (rol basina 50, idempotent)..."
/opt/venv/bin/python -m app.core.seed_personel_toplu --per-rol 50
echo "[entrypoint] admin dashboard demo verisi (hasta, randevu, sikayet, temizlik)..."
/opt/venv/bin/python -m app.core.seed_admin_dashboard_demo
echo "[entrypoint] starting: $*"
exec "$@"
