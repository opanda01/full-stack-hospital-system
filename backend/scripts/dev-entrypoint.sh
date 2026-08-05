#!/bin/sh
set -e
cd /app
echo "[entrypoint] alembic upgrade head..."
/opt/venv/bin/alembic upgrade head
echo "[entrypoint] starting: $*"
exec "$@"
