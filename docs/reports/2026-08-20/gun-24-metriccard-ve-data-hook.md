# Staj Defteri — Gün 24: MetricCard tasarım sistemi ve veri kancası

**Tarih:** 20 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Kapsam:** `MetricCard` boyut/renk varyantları; `dashboardEsikleri.ts`; `useAdminDashboardData` güncellemesi

---

### 1. Günün Amacı

Gün 23’te hazırlanan backend API’lerini frontend’e bağlamak için önce tasarım sistemi ve veri katmanını güncellemek. Dekoratif pastel arka planlar kaldırılacak; kartlar nötr panel + sol border semantiği ile çalışacak.

| Bileşen | Değişiklik |
|---------|------------|
| `MetricCard` | `size: hero \| default \| compact`, `kritik` renk |
| `metricCardSemantics.ts` | `renkKritik`, eşik tabanlı `renkKuyrukSayaci` |
| `dashboardEsikleri.ts` | Şikayet/randevu/temizlik uyarı-kritik eşikleri |
| `useAdminDashboardData` | Yeni endpoint query’leri, `sikayet-oneri/ozet` |

---

### 2. MetricCard genişlemesi

**Dosya:** `web/src/shared/ui/app-shell/MetricCard.tsx`

- `MetricCardRenk` → `"kritik"` eklendi (`--status-kritik-fg`)
- `size="hero"`: `text-4xl`, `p-4 sm:p-5`
- `size="compact"`: `text-lg`, ikon gizli
- Arka plan: tüm kartlarda `--panel-bg`; renk yalnızca `border-l-4`

Dekoratif ikon kutusu yalnızca hero ve uyarı/kritik kartlarda gösterilir.

---

### 3. Eşik config

**Dosya:** `web/src/features/dashboard/config/dashboardEsikleri.ts`

```ts
export const DASHBOARD_ESIKLERI = {
  sikayetBekleyen: { uyari: 1, kritik: 3 },
  randevuBekleyen: { uyari: 5, kritik: 15 },
  temizlikAcik:    { uyari: 3, kritik: 8 },
} as const;
```

`renkKritik(count, esik)` → `count >= kritik` kırmızı, `>= uyari` amber, sıfırda yeşil.

---

### 4. useAdminDashboardData

**Dosya:** `web/src/features/dashboard/hooks/useAdminDashboardData.ts`

Yeni React Query anahtarları:

- `dashboard-admin-ozet` — genişletilmiş tip
- `dashboard-admin-trend` — `gun=7`
- `dashboard-admin-servis-doluluk`
- `dashboard-analytics-ozet` — yatak pasta grafiği
- `sikayet-ozet` — `bekleyen` sayısı (paginated total yerine)

`temizlikler` client-side 200 kayıt filtresi kaldırıldı; sayılar backend özetten gelir.

---

### 5. DashboardGrid preset’leri

**Dosya:** `web/src/shared/ui/dashboard/DashboardSection.tsx`

- `cols="hero"` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- `cols="compact"` → `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`

---

### 6. Test

```bash
cd web && npm run typecheck
```

`MetricCard` mevcut kullanımları (başhekim analytics, bekleyenler sekmesi) geriye uyumlu kaldı.

---

### 7. Öğrenilenler

- Tasarım token’ları (eşik config) kodda dağılmış sabitlerden ayrılmalıdır.
- KPI kartında arka plan rengi yerine border semantiği sakin ve güven veren UI üretir.
- Hook katmanı API değişikliklerini tek noktada toplar; sayfa bileşenleri sade kalır.
