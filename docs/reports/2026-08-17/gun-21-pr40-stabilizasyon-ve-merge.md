# Staj Defteri — Gün 21: PR #40 sonrası stabilizasyon ve merge doğrulama

**Tarih:** 17 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Dal:** `feature/plan-uygulama`  
**Kapsam:** Plan demo ve üst bar navigasyon merge sonrası regresyon kontrolü; `pnpm-lock` uyumu; demo seed doğrulama

---

### 1. Günün Amacı

Gün 19–20’de tamamlanan plan demo ve navigasyon düzenlemelerinin `main` ile birleştirilmesinden sonra branch’in tekrar çalışır durumda olduğunu doğrulamak. CI’da yaşanan `pnpm frozen-lockfile` hatasını gidermek ve demo ortamında tüm rollerin gösterge paneline erişebildiğini test etmek.

| Alan | Sorun | Çözüm |
|------|--------|--------|
| Lock dosyası | `web` importer ile `package.json` uyumsuzluğu | `pnpm-lock.yaml` güncellendi (`ade2a4b`) |
| Branch | `main` ile conflict | `router.tsx`, profil URL, seed dosyalarında manuel çözüm (`dc40168`) |
| Demo veri | Plan demo seed eksik kalabilir | `seed_plan_demo.py` + Docker entrypoint sırası kontrol edildi |

---

### 2. Yapılan işler

- **Merge conflict çözümü:** `origin/main` → `feature/plan-uygulama` birleştirmesinde navigasyon (`nav-domains.ts`), profil yönlendirmesi ve RBAC seed dosyalarında çakışmalar giderildi.
- **CI doğrulama:** GitHub Actions `lint` ve `backend-tests` iş akışları yeşil olana kadar tekrarlandı.
- **Manuel smoke test:** Admin, başhekim, müdür, doktor rollerinde üst şerit (`PrimaryNav` + `SecondaryNav`) ve gösterge alt sekmeleri kontrol edildi.
- **PHR mobil:** Aşı ve aktif ilaç ekranlarının backend endpoint’leriyle eşleştiği doğrulandı (`/hastalar/ben/asilar`, aktif ilaç listesi).

---

### 3. Test ve doğrulama

```bash
pnpm install
pnpm run typecheck
cd backend && python -m pytest tests/features/test_plan_dashboard.py -q
pnpm dev:web
```

Manuel: `/admin/ozet`, `/bashekim/ozet`, `/mudur/ozet` — sekme geçişleri ve boş durum metinleri.

---

### 4. Değişen / incelenen dosyalar

| Katman | Dosyalar |
|--------|----------|
| Lock / CI | `pnpm-lock.yaml`, `.github/workflows/` |
| Merge | `web/src/app/router.tsx`, `web/src/shared/auth/authStore.ts` |
| Seed | `backend/app/core/seed_plan_demo.py`, `dev-entrypoint.sh` |
| Dokümantasyon | `docs/reports/2026-08-11/gun-19-plan-demo-ust-bar-nav-phr.md` (referans) |

---

### 5. Öğrenilenler

- Büyük feature branch’lerde `main` merge’ü erken ve sık yapılmalı; conflict birikimi son günleri zorlaştırır.
- Monorepo’da lock dosyası kök ve `web` importer uyumu CI’da bloklayıcıdır.
- Demo seed idempotent tasarlanmalı; Docker yeniden başlatmada veri tutarlılığı korunur.
