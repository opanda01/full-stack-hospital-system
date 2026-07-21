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

## Ops

- [ ] Health check: `GET /health`
- [ ] Alembic migrations deploy pipeline’da `upgrade head`
- [ ] Backup / restore prosedürü
- [ ] Log aggregation (uygulama + access)

## Shared types

Backend ayaktayken:

```bash
pnpm --filter @hastane/shared-types generate
```
