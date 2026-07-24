# Veritabanı operasyon runbook — modern hibrit / hastane HBYS

## Production API

- `uvicorn` / gunicorn: `--reload` kullanmayın.
- Örnek: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2`
- `DB_POOL_SIZE` × workers + Celery < Postgres `max_connections`.

## PgBouncer

- `SET LOCAL app.actor_id` transaction-scopeddır.
- **Yalnız transaction pooling** kullanın (session pooling actor sızdırır).

## Alembic 012 cutover

- `denetim_kayitlari` rename AccessExclusiveLock alır — düşük trafikli pencerede çalıştırın.
- Sequence: migration `setval` uygular; smoke insert ile doğrulayın.
- `denetim_kayitlari_old` doğrulama sonrası drop.

## Alembic 013 public_id (PHI)

- `hastalar` / `randevular` / `tetkikler`: `public_id UUID NOT NULL UNIQUE`; integer PK/FK değişmez.
- Dış API kimliği = `public_id`; iç audit `kaynak_id` = integer PK string.
- `hastalar_audit_trigger` `detay.hasta_public_id` yazar; eski denetim satırlarına backfill yok.

## timestamptz

- Randevu: `USING tarih_saat AT TIME ZONE 'Europe/Istanbul'`.
- Migration sonrası bilinen satırın yerel saatini assert edin.

## WAL / PITR

| Hedef | Öneri |
|-------|--------|
| RPO | ≤ 5–15 dk (continuous WAL archive) |
| RTO | ≤ 1–4 saat |

1. `archive_mode=on`, `archive_command` veya managed provider PITR.
2. Periyodik `pg_basebackup`.
3. Geri yükleme tatbikatı (çeyreklik).
4. Audit + PHI tabloları yedek kapsamında.

## Audit partition arşiv (cold)

1. Eski RANGE partition **DETACH**.
2. Online tutulacak süre (ör. 2–3 yıl) sonra `pg_dump` → cold storage.
3. Dump doğrulanınca partition **DROP**.
4. Yasal saklama ~20 yıl cold’da; ham DELETE ile PHI/audit temizliği yok.

## Hasta audit trigger performansı

- Prod’da `UPDATE hastalar` p95 ölçün (trigger açık).
- Aşımda önce `mask_dict(..., narrow=True)` alan setine düşün; TC/adres maske kuralları değişmez.

## Compose otomatik backup

- `postgres-backup` servisi günlük `pg_dump` alır; volume `postgres_backups`, 7 gün saklama.
- RPO ≈ saat mertebesi (WAL/PITR bu runbook’ta ayrı, managed/prod adımı).
- **Haftalık CI:** `.github/workflows/restore-smoke.yml` restore-smoke çalıştırır.
- **Çeyreklik manuel:** bu bölümdeki PITR/full restore tatbikatı + RTO ölçümü.
- Lokal: `bash scripts/restore-smoke.sh` veya `scripts/restore-smoke.ps1`.

## PHI encrypt backfill

1. Backup doğrulanmış; düşük trafikli pencere.
2. `PHI_ENCRYPT_ENABLED=false` iken kolonlar hazır (`015_kvkk_phi`).
3. `python -m scripts.phi_encrypt_backfill --batch-size 500` — `app.skip_hasta_audit=1`, batch özet `PHI_ENCRYPT_BACKFILL`.
4. Doğrulama sonrası `PHI_ENCRYPT_ENABLED=true`.
5. Plaintext drop ayrı migration (doğrulama sonrası).
