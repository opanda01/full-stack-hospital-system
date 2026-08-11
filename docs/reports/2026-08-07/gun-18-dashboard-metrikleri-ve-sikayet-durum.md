# Staj Defteri — Gün 18: Gösterge metrikleri ve şikayet durum yönetimi

**Tarih:** 7 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Dal / commit:** `feature/plan-uygulama` — `3952aa3`  
**Kapsam:** Admin / Başhekim / Müdür gösterge panellerinde anlamsal KPI kartları; şikayet/öneri dört durumlu filtre ve PATCH güncelleme; backend özet endpoint ve RBAC

---

### 1. Günün Amacı

Gün 17’de gösterge hub ve domain navigasyonu tamamlandıktan sonra özet sekmeleri hâlâ düz metrik listesi ve sınırlı bağlam sunuyordu. Hedef: **KPI kartlarını anlamsal renk ve durum rozetleriyle zenginleştirmek**, boş durumları net göstermek, şikayet modülünde **durum yaşam döngüsünü** (filtre + güncelleme) uçtan uca bağlamak.

| Alan | Önce | Sonra |
|------|------|--------|
| MetricCard | Tek tip görünüm | `metricCardSemantics` — kritik / uyarı / nötr renkler, trend, status badge |
| Admin/Başhekim/Müdür özet | Basit sayılar | `DashboardInsetList`, `QuickLinkGrid`, `/sikayet-oneri/ozet` entegrasyonu |
| Şikayet listesi | Salt okunur liste | Dört durum filtresi + PATCH durum güncelleme |
| Backend | Durum alanı sınırlı | Özet endpoint, enum, RBAC, test suite |

---

### 2. Web — gösterge metrikleri

- **`MetricCard` genişlemesi:** `web/src/shared/ui/app-shell/MetricCard.tsx`, `metricCardSemantics.ts` — renk (`notr`, `uyari`, `kritik`), tıklanabilir `to`, trend, `statusBadge`.
- **Dashboard inset bileşenleri:** `DashboardInsetList.tsx` — bekleyen iş listesi; `QuickLinkGrid` iyileştirmeleri.
- **Admin özet:** `pages/admin/dashboard/tabs/OzetTab.tsx` — KPI grid, şikayet özeti, kısayollar; `BekleyenlerTab`, `IkTab`, `OperasyonTab` uyumu.
- **Yönetim özet:** `pages/ortak/yonetim-dashboard/tabs/OzetTab.tsx`, `BekleyenlerTab.tsx` — Başhekim/Müdür paylaşımlı veri kancaları.
- **Veri kancaları:** `useAdminDashboardData.ts`, `useYonetimDashboardData.ts` — şikayet özet API bağlantısı.

---

### 3. Web — şikayet durum yönetimi

- **Ortak sayfa:** `web/src/pages/ortak/sikayet/index.tsx` — durum filtresi (beklemede, inceleniyor, çözüldü, reddedildi), liste güncelleme aksiyonları.
- **Tipler:** `web/src/features/sikayet-oneri/types.ts` — durum enum ve UI eşlemesi.
- **Başhekim router:** `bashekim/router.py` — yetki uyumu (şikayet görünürlüği).

---

### 4. Backend — şikayet API

- **Router / service:** `sikayet_oneri/router.py`, `service.py`, `schemas.py` — `GET …/ozet`, `PATCH …/{id}/durum`.
- **RBAC:** `core/permissions.py`, `docs/rbac-yetki-matrisi.md` güncellemesi.
- **Spec:** `docs/backend-sikayet-durum-spec.md` — durum geçişleri ve yetki tablosu.
- **Test:** `backend/tests/features/test_sikayet_oneri_durum.py` (104 satır).

---

### 5. Test ve doğrulama

- `pnpm run typecheck` (web) — başarılı.
- `pytest tests/features/test_sikayet_oneri_durum.py` — önerilir.
- Manuel: Admin özet KPI renkleri; şikayet listesinde filtre ve durum PATCH (yetkili rol).

---

### 6. İlgili dosyalar (özet)

| Katman | Dosyalar |
|--------|----------|
| Web UI | `MetricCard.tsx`, `metricCardSemantics.ts`, `dashboard/DashboardInsetList.tsx` |
| Dashboard | `admin/dashboard/tabs/*`, `yonetim-dashboard/tabs/*`, `features/dashboard/hooks/*` |
| Şikayet | `ortak/sikayet/index.tsx`, `features/sikayet-oneri/types.ts` |
| Backend | `sikayet_oneri/*`, `bashekim/router.py`, `permissions.py` |
| Docs | `backend-sikayet-durum-spec.md`, `rbac-yetki-matrisi.md` |

---

### 7. Sonraki adımlar (kısa)

- Gösterge sekmelerine canlı laborant/idari özet API’leri (Gün 19’da tamamlandı).
- Şikayet durum geçişlerinde audit log (isteğe bağlı).

---

*Bu rapor, Gün 17 navigasyon redesign (`gun-17-web-dashboard-nav-redesign.md`) sonrası aynı gün içindeki `3952aa3` commit’ini kapsar. Plan demo ve üst bar navigasyon: `docs/reports/2026-08-11/gun-19-plan-demo-ust-bar-nav-phr.md`.*
