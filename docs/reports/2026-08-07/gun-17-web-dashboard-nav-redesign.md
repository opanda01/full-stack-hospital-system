# Staj Defteri — Gün 17: Web gösterge paneli ve panel navigasyon redesign

**Tarih:** 7 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Kapsam:** Admin / Başhekim / Müdür web panelinde üst sekmeli gösterge hub’ı; domain tabanlı üst modül navigasyonu; kabuk (AppShell) sadeleştirmesi; üst şerit başlık temizliği

---

### 1. Günün Amacı

Uzun sol sidebar ve tek düzey menü, yönetim rollerinde modül karmaşası yaratıyordu. Hedef: **önce gösterge panelini komuta merkezi** haline getirmek (URL’li sekmeler, KPI grid, kısayollar), ardından **üstte ana modül sekmeleri** + bağlamsal yan menü ile pilot üç rolde navigasyonu sadeleştirmek. Gün içinde ek UX iterasyonu: üst şeridi tam genişliğe almak, sidebar’ı daraltmak, tekrarlayan “admin / özet” başlıklarını kaldırmak.

| Alan | Önce | Sonra |
|------|------|--------|
| Dashboard | Tek sayfa, `RoleDashboard` metrik listesi | `/admin/ozet`, `bekleyenler`, `operasyon`, … nested rotalar |
| Üst navigasyon | Yok (yalnızca sidebar) | `PrimaryNav` — Gösterge, İnsan & erişim, Hasta & klinik, … |
| Kabuk | Sidebar + iç içe sağ panel | Sticky üst header; altta dar sidebar + içerik |
| Üst başlık | Breadcrumb + sayfa adı (ör. özet) | Pilot rollerde yalnızca logo + bildirim/kullanıcı |

---

### 2. Faz 1 — Dashboard hub

#### Ortak UI

- `web/src/shared/ui/dashboard/`: `DashboardHub`, `DashboardTabs` (NavLink, `aria-selected`), `QuickLinkGrid`, `DashboardSection` / `DashboardGrid`.
- Sekmeler NavLink tabanlı (Radix tabs paketi kurulumu atlandı).

#### Admin

- Rotalar: `web/src/app/router.tsx` — `AdminDashboardLayout` altında `ozet`, `bekleyenler`, `operasyon`, `insan-kaynaklari`, `sistem`.
- Veri: `features/dashboard/hooks/useAdminDashboardData.ts` (mevcut REST; yeni aggregate API yok).
- Sekme içerikleri: `web/src/pages/admin/dashboard/tabs/*`.

#### Başhekim / Müdür

- Başhekim: `useBashekimOzet`, kurumsal sekme, `BashekimErisimOnaylariPage` iç içe `AppShell` kaldırıldı → `erisim-onaylari.tsx`.
- Müdür: `YonetimDashboardLayout` + ortak `yonetim-dashboard/tabs/*` (`useYonetimDashboardData`).
- Giriş sonrası ana yollar: `/admin/ozet`, `/bashekim/ozet`, `/mudur/ozet` (`authStore` `ROLE_HOME`).

---

### 3. Faz 2 — Domain navigasyonu

- `web/src/shared/config/nav-domains.ts`: `NAV_DOMAINS`, `resolveNavDomain`, `flattenDomains`.
- `RoleLayoutRoute`: pilot rollerde `navDomains` → `AppShell`.
- `PrimaryNav` + sidebar yalnızca aktif domain `groups`.
- Sidebar genişlik: domain modunda **200px**, diğer roller **248px**; domain modunda marka üst şeritte.

**Dokümantasyon:** `web/docs/navigation.md` (domain tablosu, dashboard sekmeleri).

---

### 4. Kabuk ve üst şerit iterasyonları

1. **Layout:** `AppShell` — üstte tam genişlik `header` (Topbar + PrimaryNav), `sticky`; içerik satırında sidebar + `main`.
2. **Topbar:** `showBrand` iken breadcrumb ve sayfa başlığı tamamen gizlendi (tüm modül sekmelerinde); ekran okuyucu için `aria-label={pageTitle}`.
3. **DashboardHub:** “Gösterge Paneli” eyebrow ve varsayılan alt başlık metni kaldırıldı; “Hoş geldiniz, …” + dashboard sekmeleri kaldı.

---

### 5. Test ve doğrulama

- `pnpm run typecheck` (web paketi) — başarılı.
- Manuel öneri: Admin/Başhekim/Müdür ile üst modül sekmeleri, gösterge alt sekmeleri, deep link (`/admin/kullanicilar` vb.) ve mobil yatay kaydırma.

---

### 6. İlgili dosyalar (özet)

| Katman | Dosyalar |
|--------|----------|
| Kabuk | `shared/ui/app-shell/AppShell.tsx`, `Topbar.tsx`, `Sidebar.tsx`, `PrimaryNav.tsx` |
| Nav | `shared/config/nav-domains.ts`, `nav-items.ts` (Dashboard → `/…/ozet`) |
| Dashboard | `shared/ui/dashboard/*`, `features/dashboard/**`, `pages/admin/dashboard/**`, `pages/bashekim/dashboard/**`, `pages/ortak/yonetim-dashboard/**` |
| Router | `app/router.tsx` |
| Auth | `shared/auth/authStore.ts` (rol ana yolları) |
| Docs | `web/docs/navigation.md` |

---

### 7. Sonraki adımlar (kısa)

- Doktor / hemşire için `nav-domains` genişletmesi.
- İsteğe bağlı: `GET /dashboard/{rol}/hub` aggregate API.
- Mobil (`< lg`) sidebar drawer.

---

*Bu rapor, Gün 16 operasyon UI commit’lerinden (`gun-16-hbys-operasyon-ui-faz-c.md`) ayrı olarak yalnızca web panel tasarım / navigasyon redesign değişikliklerini kapsar.*
