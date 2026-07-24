#!/usr/bin/env bash
# Restore smoke: son dump → geçici Postgres → SELECT count(*) FROM hastalar
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/postgres_backups}"
LATEST="$(ls -1t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -1 || true)"
if [[ -z "${LATEST}" ]]; then
  LATEST="$(ls -1t "$BACKUP_DIR"/*.sql 2>/dev/null | head -1 || true)"
fi
if [[ -z "${LATEST}" ]]; then
  echo "No backup found in $BACKUP_DIR — creating synthetic dump from running compose..."
  docker compose exec -T postgres pg_dump -U hastane hastane_db > /tmp/hastane-smoke.sql
  LATEST=/tmp/hastane-smoke.sql
fi
echo "Using backup: $LATEST"
CID="$(docker run -d --rm -e POSTGRES_PASSWORD=smoke -e POSTGRES_DB=smoke postgres:16-alpine)"
trap 'docker stop "$CID" >/dev/null 2>&1 || true' EXIT
for i in $(seq 1 30); do
  docker exec "$CID" pg_isready -U postgres && break
  sleep 1
done
if [[ "$LATEST" == *.gz ]]; then
  gunzip -c "$LATEST" | docker exec -i "$CID" psql -U postgres -d smoke
else
  docker exec -i "$CID" psql -U postgres -d smoke < "$LATEST"
fi
COUNT="$(docker exec "$CID" psql -U postgres -d smoke -tAc 'SELECT count(*) FROM hastalar' || echo fail)"
echo "hastalar count=$COUNT"
[[ "$COUNT" != "fail" ]]
