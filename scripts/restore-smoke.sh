#!/usr/bin/env bash
# Restore smoke: son dump → geçici Postgres → SELECT count(*) FROM hastalar
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/postgres_backups}"
LATEST="$(ls -1t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -1 || true)"
if [[ -z "${LATEST}" ]]; then
  LATEST="$(ls -1t "$BACKUP_DIR"/*.sql 2>/dev/null | head -1 || true)"
fi

wait_compose_postgres() {
  local tries="${1:-60}"
  local i
  for ((i = 1; i <= tries; i++)); do
    if docker compose exec -T postgres pg_isready -U hastane -d hastane_db >/dev/null 2>&1 \
      && docker compose exec -T postgres psql -U hastane -d hastane_db -v ON_ERROR_STOP=1 -tAc 'SELECT 1' >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "Compose postgres not ready after ${tries}s" >&2
  return 1
}

wait_container_postgres() {
  local cid="$1"
  local db="${2:-postgres}"
  local user="${3:-postgres}"
  local tries="${4:-60}"
  local i
  for ((i = 1; i <= tries; i++)); do
    if docker exec "$cid" psql -U "$user" -d "$db" -v ON_ERROR_STOP=1 -tAc 'SELECT 1' >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "Postgres in container ${cid} not ready after ${tries}s" >&2
  return 1
}

if [[ -z "${LATEST}" ]]; then
  echo "No backup found in $BACKUP_DIR — creating synthetic dump from running compose..."
  wait_compose_postgres 60
  docker compose exec -T postgres pg_dump -U hastane hastane_db > /tmp/hastane-smoke.sql
  LATEST=/tmp/hastane-smoke.sql
fi
echo "Using backup: $LATEST"
CID="$(docker run -d --rm -e POSTGRES_PASSWORD=smoke -e POSTGRES_DB=smoke postgres:16-alpine)"
trap 'docker stop "$CID" >/dev/null 2>&1 || true' EXIT
wait_container_postgres "$CID" smoke postgres 60

restore_once() {
  if [[ "$LATEST" == *.gz ]]; then
    gunzip -c "$LATEST" | docker exec -i "$CID" psql -U postgres -d smoke -v ON_ERROR_STOP=1
  else
    docker exec -i "$CID" psql -U postgres -d smoke -v ON_ERROR_STOP=1 < "$LATEST"
  fi
}

attempt=1
max_attempts=5
until restore_once; do
  if (( attempt >= max_attempts )); then
    echo "Restore failed after ${max_attempts} attempts" >&2
    exit 2
  fi
  echo "Restore attempt ${attempt} failed (postgres may still be starting); retrying..." >&2
  sleep 2
  wait_container_postgres "$CID" smoke postgres 30
  attempt=$((attempt + 1))
done

COUNT="$(docker exec "$CID" psql -U postgres -d smoke -tAc 'SELECT count(*) FROM hastalar' || echo fail)"
echo "hastalar count=$COUNT"
[[ "$COUNT" != "fail" ]]
