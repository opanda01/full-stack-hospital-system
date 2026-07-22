# Ürün Yol Haritası (Auth & Bildirim)

## Faz A — Backend auth (tamamlandı)

- JWT access + refresh; `oturum_tipi` (personel | hasta)
- Çift profil: aynı `Kullanici` (TC unique) üzerinde Personel + Hasta
- Personel: sicil / kullanıcı adı / e-posta login, zorunlu ilk şifre + KVKK (allowlist)
- Hasta: OTP kayıt/giriş; `/auth/register` deprecated (`X-Deprecated`, `Sunset`)
- Celery + Redis personel CSV/XLSX import + progress polling
- Denetim kaydı + güvenilir proxy IP (`TRUSTED_PROXY_IPS`)
- Bildirim: `BildirimPort` + console implementasyonu

## Faz B — Web personel UI (tamamlandı)

- Sicil / kullanıcı adı / e-posta login formu; `VITE_USE_MOCK_AUTH=false` (dev varsayılan)
- İlk giriş: `/sifre-degistir` + `/kvkk-onay` (`sifre_degistirmeli_mi` / `kvkk_onaylandi_mi`)
- `OnboardingGuard` + API 403 onboarding yönlendirmesi
- Personel import UI + progress polling (`/admin/personel` vb.)

## Faz C — Bildirim production

- [x] E-posta: `BILDIRIM_BACKEND=smtp` + `SMTP_*` (`smtplib`)
- [ ] Gerçek SMS gateway adaptörü (SMTP yalnızca e-posta)
- [ ] Import için **batch / rate-limited kuyruk** (2000 satır × ayrı API call riski)
- [ ] Retry / DLQ

## Faz D — Hasta mobil istemci

- OTP gönder / doğrula ekranları
- `oturum_tipi=hasta` token kullanımı
- `/auth/register` kaldırma tarihi (`Sunset`)

## Faz E — Ops sertleştirme

- [x] Uygulama login rate limit (`LOGIN_RATE_LIMIT_PER_MINUTE`) — WAF hâlâ önerilir
- [x] CORS allowlist (`CORS_ORIGINS`)
- [x] Audit retention + liste (`AUDIT_RETENTION_DAYS` + `GET /denetim/`; UI: `/admin/denetim`)
- [x] Salt-okunur RBAC UI (`/admin/rbac`)
- [ ] İsteğe bağlı DB `roller`/`izinler` sync (şu an kod matrisi kaynak gerçeği)
