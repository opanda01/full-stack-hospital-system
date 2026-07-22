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

## Faz F — Başhekim paneli (uygulandı)

- Personel erişim onayı (`erisim_durumu`, onay/red/bypass audit)
- BASHEKIM / MUDUR izin ayrımı + gözetim dashboard (`/bashekim/ozet`, TTL)
- PHI görüntüleme audit (`KAYIT_GORUNTULEME`)
- MHRS kapasite, E-Nabız/SGK mock entegrasyon, klinik onay kuyruğu
- Eczane / fatura / döner görüntüleme
- Yetki duyurusu + sistem gözetim
- Envanter: `docs/bashekim-izin-envanteri.md`

## Faz G — Doktor klinik paneli (uygulandı)

- Kapsam: `GET /hastalar/benim`, `hasta:goruntule` (türevsel); genel hasta listesi doktor’a kapalı
- Canlı: randevularım, muayene (oluştur/güncelle), hastalarım, tetkiklerim
- Reçete / sevk / tıbbi rapor → `klinik_onay:olustur` + başhekim onayı
- Konsültasyon + sağlık kurulu (üye kapsamı)
- Yasaklı: personel, denetim, MHRS, fatura, eczane stok, RBAC UI

