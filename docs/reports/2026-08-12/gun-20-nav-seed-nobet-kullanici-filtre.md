# Staj Defteri — Gün 20: Nav hizası, toplu personel seed, nöbet silme ve kullanıcı filtreleri

**Tarih:** 12 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Dal:** `feature/plan-uygulama`  
**Kapsam:** Üst bar alt navigasyon tutarlılığı; profil URL düzeltmesi; rol başına 50 test personeli; nöbet çizelgesi tablodan silme; kullanıcı listesi sunucu tarafı filtre

---

### 1. Günün Amacı

Gösterge panelindeki alt sekme yerleşimini tüm modüllere yaymak (header’da bitişik alt şerit yerine içerik alanında sekmeler). Profilim linkinin kırık olması (`/admin/ozet/profil`) giderildi. Demo ortamında silinmiş toplu personel verisi yeniden üretildi. Nöbet çizelgesinde DnD sonrası tablodan doğrudan silme eklendi. Kullanıcı yönetimi filtrelerinin boş liste vermesi düzeltildi.

| Alan | Önce | Sonra |
|------|------|--------|
| Alt navigasyon | Gösterge: içerikte; diğer modüller: header’da bitişik | Tüm modüller: `SecondaryNav` içerik alanı üstünde (Gösterge ile aynı his) |
| Profilim URL | `homeForRole` → `/admin/ozet/profil` (404) | `roleRootForRole` → `/admin/profil` |
| Test personel | Yalnızca `seed_rbac` (rol başına 1) | `seed_personel_toplu`: 11 rol × 50 (550 kayıt), Docker entrypoint’te otomatik |
| Nöbet silme | Küçük × (sürükleme ile çakışma) | Çöp kutusu + sürükle-bırak silme alanı |
| Kullanıcı filtre | İlk 50 kayıt üzerinde istemci filtresi | API `rol` + `aktif_mi` parametreleri |

---

### 2. Web — navigasyon ve profil

- **`AppShell.tsx`:** `SecondaryNav` header’dan kaldırıldı; `gosterge` dışındaki domain’lerde `<main>` üstüne taşındı. Gösterge’de `DashboardTabs` içerikte kaldı.
- **`SecondaryNav.tsx`:** Gösterge sekmeleriyle uyumlu stil (`rounded-t-md`, alt çizgi).
- **`roleRootForRole()`** (`authStore.ts`): Dashboard alt yolu (`/ozet`) atlanarak hesap sayfaları için rol kökü (`/admin`, `/bashekim`, …).
- **`Topbar`**, **`router` ProfilRedirect/AyarlarRedirect**, **`ayarlar/index.tsx`:** Profil ve ayarlar linkleri `roleRootForRole` kullanıyor.

---

### 3. Backend — toplu personel seed

- **`seed_personel_toplu.py`:** `SEED_ROLLER` genişletildi — RADYOLOG, ADMIN, BASHEKIM, MUDUR eklendi (toplam 11 rol). Doktor kaydı `DOKTOR` + `RADYOLOG` için.
- **`dev-entrypoint.sh`:** `seed_personel_toplu --per-rol 50` idempotent çağrı.
- **`seed_cli.py`:** Tam demo seed sonrası toplu personel.

Şifre: `Test1234!` — e-posta örneği: `hemsire.test001@hastane.example.com`

---

### 4. Web — nöbet çizelgesi silme

- **`DepartmanNobetTablosu.tsx`:** `Trash2` butonu; `onPointerDown` ile sürükleme çakışması giderildi.
- **`NobetSilmeAlani.tsx`:** Tablo altında DnD silme bırakma alanı (`NOBET_SILME_DROP_ID`).
- **`nobet/index.tsx`:** `onDragEnd` silme alanına bırakınca `DELETE /nobet-cizelgesi/{id}`.

---

### 5. Kullanıcı listesi filtreleri

- **Backend:** `GET /kullanicilar/?rol=&aktif_mi=` — `list_kullanicilar` servisinde `aktif_mi` filtresi.
- **Frontend:** `KullaniciYonetimiPage` filtreleri API’ye iletiliyor; sayfa filtresi değişince sıfırlanıyor. `RADYOLOG` rol seçeneği eklendi. Personel sayfası rol listesine `RADYOLOG` eklendi.

---

### 6. Test ve doğrulama

```bash
cd web && npm run typecheck
cd backend && python -m app.core.seed_hastane && python -m app.core.seed_personel_toplu --per-rol 50
```

Manuel: `/admin/kullanicilar` → rol HEMSIRE → 50 kayıt; Topbar Profilim → `/admin/profil`; Nöbet → hücre çöp kutusu veya sürükle-sil alanı.

---

### 7. Değişen dosyalar (özet)

| Katman | Dosyalar |
|--------|----------|
| Backend seed | `seed_personel_toplu.py`, `seed_cli.py`, `dev-entrypoint.sh` |
| Backend API | `kullanicilar/router.py`, `kullanicilar/service.py` |
| Web nav/auth | `AppShell.tsx`, `SecondaryNav.tsx`, `Topbar.tsx`, `authStore.ts`, `router.tsx` |
| Web nöbet | `DepartmanNobetTablosu.tsx`, `NobetDepartmanPanel.tsx`, `NobetSilmeAlani.tsx`, `nobet/index.tsx`, `week.ts` |
| Web admin | `kullanicilar/index.tsx`, `personel/index.tsx`, `ayarlar/index.tsx` |
