# Restore smoke (Windows) — requires Docker Desktop
$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $PSScriptRoot "..\docker-compose.yml"))) {
  $Root = Resolve-Path (Join-Path $PSScriptRoot "..")
} else {
  $Root = Resolve-Path (Join-Path $PSScriptRoot "..")
}
Set-Location $Root
$dump = Join-Path $env:TEMP "hastane-smoke.sql"
docker compose exec -T postgres pg_dump -U hastane hastane_db | Set-Content -Path $dump -Encoding utf8
$cid = docker run -d --rm -e POSTGRES_PASSWORD=smoke -e POSTGRES_DB=smoke postgres:16-alpine
try {
  for ($i = 0; $i -lt 30; $i++) {
    docker exec $cid pg_isready -U postgres | Out-Null
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 1
  }
  Get-Content $dump -Raw | docker exec -i $cid psql -U postgres -d smoke
  $count = docker exec $cid psql -U postgres -d smoke -tAc "SELECT count(*) FROM hastalar"
  Write-Host "hastalar count=$count"
  if (-not $count) { throw "restore smoke failed" }
} finally {
  docker stop $cid | Out-Null
}
