# Production Checklist

## Secrets & config

- [ ] `SECRET_KEY` / JWT secret production değeri (`.env` asla commit edilmez)
- [ ] PostgreSQL credentials güçlü ve rotasyonlu
- [ ] `CORS_ORIGINS` yalnızca bilinen web/mobil origin’ler
- [ ] Demo seed (`seed_cli`) production’da çalıştırılmaz

## Auth

- [ ] Access + refresh token süreleri production için ayarlı
- [ ] Login rate limiting (reverse proxy / WAF)
- [ ] HTTPS zorunlu (TLS termination)
- [ ] Refresh token rotation gözden geçirildi

## Data & retention

- Klinik kayıtlar (muayene, tetkik, randevu) hard-delete edilmez.
- Kullanıcı silme = soft deactivate (`aktif_mi=False`) — `/kullanicilar/{id}` DELETE.
- Audit log: `denetim_kayitlari` (`actor_id`, `aksiyon`, `kaynak`, `kaynak_id`, `ip_adresi`, `zaman`).
  IP için `TRUSTED_PROXY_IPS` tanımlı değilse `X-Forwarded-For` yok sayılır.
  Listeleme: `GET /denetim/` (ADMIN). Saklama: `AUDIT_RETENTION_DAYS`.

## Ops

- [ ] CI yeşil: bkz. [CI.md](CI.md) — branch protection required check: `ci-success`
- [ ] Health check: `GET /health`
- [ ] Login rate limit: `LOGIN_RATE_LIMIT_PER_MINUTE` (+ WAF önerilir)
- [ ] `CORS_ORIGINS` yalnızca bilinen origin’ler
- [ ] Bildirim: `BILDIRIM_BACKEND=console|log|smtp`
- [ ] Alembic migrations deploy pipeline’da `upgrade head`
- [ ] Backup / restore prosedürü
- [ ] Log aggregation (uygulama + access)

## Shared types

Backend ayaktayken:

```bash
pnpm --filter @hastane/shared-types generate
```
