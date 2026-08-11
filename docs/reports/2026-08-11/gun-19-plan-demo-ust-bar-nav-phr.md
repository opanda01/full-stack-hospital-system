# Staj Defteri — Gün 19: Plan demo kapsamı, üst bar navigasyon ve PHR mobil

**Tarih:** 11 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Dal / commit:** `feature/plan-uygulama` — `8f5ad30`  
**PR:** [#40](https://github.com/opanda01/full-stack-hospital-system/pull/40)  
**Kapsam:** Prod olmayan plan demo (mock entegrasyon, BI, PHR); tüm personel rollerinde sidebar kaldırılıp üst sekme navigasyonu; profil/ayarlar layout düzeltmesi; mobil aşı ve aktif ilaç ekranları

---

### 1. Günün Amacı

Panates/Probel benzeri demo senaryolarını **canlı prod entegrasyonu olmadan** uçtan uca göstermek; web panelde navigasyonu sidebar’dan **üst modül sekmelerine** taşımak; hasta PHR’yi mobilde genişletmek. Gün içi UX düzeltmeleri: Profilim tıklanınca çift sidebar, gösterge panelinde kayıp menü, hemşirede sekme eksikliği.

| Alan | Önce | Sonra |
|------|------|--------|
| Navigasyon | Sidebar (pilot rollerde domain + yan menü) | Tüm roller: `PrimaryNav` + `SecondaryNav`; sidebar yok |
| Profil | `/profil` ayrı `PanelShell` → çift sidebar | Rol altı `/…/profil`, içerik only |
| Gösterge (admin vb.) | Yan menü + içerik sekmeleri | Yalnızca üst modül + `DashboardTabs` |
| Backend demo | Eksik rol özetleri | Laborant, idari, analytics özet API’leri |
| PHR | Mobil özet sınırlı | Aşı takvimi, aktif ilaçlar |
| Zorunlu bildirim | Yok | Mock BBY outbox akışı |

---

### 2. Backend — plan demo API ve seed

- **Dashboard:** `GET /dashboard/laborant/ozet`, `/idari/ozet`, `/analytics/ozet` — tetkik durumu, triyaj renkleri, yatak doluluk, outbox hata sayıları.
- **PHR:** `HastaAsiKaydi` modeli, migration `034_plan_asi_aktif`; `GET /hastalar/ben/asilar`, `/ben/aktif-ilaclar`.
- **Zorunlu bildirim:** `GET /muayeneler/zorunlu-bildirimler`, `POST …/zorunlu-bildirim-gonder`; `bby_mock_service.py` → entegrasyon outbox `BBY_MOCK`.
- **Muayene UI desteği:** Bildirim bayrakları servis/router genişlemesi; doktor muayene ekranı checkbox’ları.
- **Seed:** `seed_plan_demo.py` — örnek aşı kayıtları, demo bildirim bayrağı; `seed_cli` entegrasyonu.
- **Test:** `tests/features/test_plan_dashboard.py` (4 senaryo).

---

### 3. Web — üst bar navigasyon (tüm roller)

- **`AppShell`:** Sidebar kaldırıldı; sticky header içinde `Topbar` → `PrimaryNav` (modüller) → `SecondaryNav` (alt sayfalar). Gösterge modülünde alt şerit gizli (`DashboardTabs` içerikte).
- **`SecondaryNav.tsx`:** Yeni bileşen — domain `groups` yatay sekme.
- **`nav-domains.ts`:** `NAV_DOMAINS` tüm `Rol` için; hemşire/ebe klinik + iş plan; doktor gruplu domain; laborant, radyolog, temizlik, güvenlik, idari tanımları.
- **`RoleLayoutRoute`:** Yalnızca `navDomains` ile `AppShell`.

**Hemşire örneği:** Gösterge | Klinik | İş & plan | Hesap — alt sekmeler (ör. Servis takip, Order, Nöbet) ikinci şeritte.

---

### 4. Web — plan demo ekranları

- **Başhekim analitik:** `AnalyticsTab.tsx` — Recharts pasta/çubuk grafikleri (`/dashboard/analytics/ozet`).
- **Zorunlu bildirimler:** `bashekim/zorunlu-bildirimler/` — liste + mock gönder.
- **Laborant:** `bekleyen/index.tsx`, dashboard canlı API; **idari** dashboard canlı veri.
- **Entegrasyonlar:** Mock odaklı metin güncellemesi.
- **Kurum amblemi:** `InstitutionEmblem.tsx` — kırmızı haç + mavi halka.
- **Router:** Tüm rollere `profil` route; `ProfilRedirect`; doktor `/doktor/profil` (kişisel) vs `/doktor/profilim` (klinik).
- **Topbar / ayarlar:** Profil ve ayarlar linkleri `{rol ana yolu}/profil|ayarlar`.

---

### 5. Mobil — PHR genişlemesi

- **Yeni ekranlar:** `aktif-ilaclar/index.tsx`, `asilar/index.tsx`.
- **Özet menü:** Aşı takvimim / Aktif ilaçlarım bağlantıları.
- **API:** `hastaApi.ts` — PHR endpoint sarmalayıcıları.
- **Layout:** Tab/stack kayıtları `_layout.tsx`.
- **Lint:** `package.json` — `tsc --noEmit`.

---

### 6. Dokümantasyon ve PR

- **README:** Demo senaryoları tablosu (randevu→muayene, laborant kuyruk, mock entegrasyon, zorunlu bildirim, analitik, PHR mobil).
- **PR #40:** `feature/plan-uygulama` → `main` (Gün 16–19 commit’leri dahil).

---

### 7. Test ve doğrulama

```bash
cd backend && pytest tests/features/test_plan_dashboard.py tests/features/test_sikayet_oneri_durum.py
cd web && npm run typecheck
cd mobile && npm run lint
```

Manuel:
- Hemşire: üst modül sekmeleri, Klinik altında servis takip.
- Topbar Profilim → tek kabuk, çift sidebar yok.
- Başhekim: Analitik sekmesi, zorunlu bildirim mock gönder → outbox.
- Mobil OTP: Aşılar / Aktif ilaçlar listesi.

---

### 8. İlgili dosyalar (özet)

| Katman | Dosyalar |
|--------|----------|
| Nav | `nav-domains.ts`, `AppShell.tsx`, `SecondaryNav.tsx`, `PrimaryNav.tsx` |
| Profil | `ortak/profil/index.tsx`, `router.tsx`, `Topbar.tsx` |
| Dashboard API | `features/dashboard/router.py` |
| PHR / aşı | `asi_models.py`, `phr_service.py`, `phr_schemas.py`, `034_plan_asi_aktif.py` |
| Mock bildirim | `bby_mock_service.py`, `muayeneler/router.py`, `zorunlu-bildirimler/` |
| Mobil | `aktif-ilaclar/`, `asilar/`, `hastaApi.ts` |
| Seed / test | `seed_plan_demo.py`, `test_plan_dashboard.py` |

---

### 9. Sonraki adımlar (kısa)

- `mobile/.expo-export-test/` artefaktını `.gitignore`’a ekleme.
- Küçük ekranlarda üst sekme kaydırma UX ince ayarı.
- İsteğe bağlı: gösterge için rol bazlı `DashboardHub` (hemşire tek sekme yerine KPI alt sekmeleri).

---

*Bu rapor, `8f5ad30` commit’ini ve aynı dal üzerindeki profil/navigasyon UX iterasyonlarını kapsar. Önceki gün: `docs/reports/2026-08-07/gun-18-dashboard-metrikleri-ve-sikayet-durum.md`.*
