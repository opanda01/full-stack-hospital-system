# Staj Defteri — Gün 25: Admin Özet sekmesi yeniden yapılandırma ve grafikler

**Tarih:** 21 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Kapsam:** `OzetTab` katmanlı düzen; Recharts grafikleri; aktivite listeleri; diğer admin sekmelerinde tutarlılık

---

### 1. Günün Amacı

Gün 22 planı ve gün 23–24 altyapısı üzerine admin gösterge özet sekmesini uçtan uca yeniden kurmak: hero KPI, compact istatistik şeridi, grafik grid ve bekleyen iş listeleri.

---

### 2. OzetTab yeniden yapılandırma

**Dosya:** `web/src/pages/admin/dashboard/tabs/OzetTab.tsx`

**Hero satır (3 kart):**

| Kart | Değer | Bağlam |
|------|-------|--------|
| Bekleyen randevu | `randevu_bekleyen + randevu_onay_bekleyen` | `%X toplamın` |
| Bekleyen şikayet | `sikayet_bekleyen` | `X / Y toplam` |
| Açık temizlik | `temizlik_acik` | sıfırda “Tüm görevler tamam” |

**Compact şerit:** kullanıcı, doktor, departman, hasta, personel — `renkEnvanter()`, ikon yok.

**Alt bölge:** `DashboardGrid cols="widgets"` ile grafikler + `BekleyenIslerPanel`.

---

### 3. Yeni bileşenler

| Bileşen | Dosya | Veri |
|---------|-------|------|
| `AdminTrendChart` | `features/dashboard/components/AdminDashboardCharts.tsx` | `/dashboard/admin/trend` |
| `ServisDolulukChart` | aynı | `/dashboard/admin/servis-doluluk` |
| `YatakOzetChart` | aynı | `/dashboard/analytics/ozet` |
| `BekleyenIslerPanel` | `BekleyenIslerPanel.tsx` | şikayet + randevu listeleri |
| `ChartCard` | `shared/ui/dashboard/ChartCard.tsx` | `raporlar` sayfasından extract |

Recharts: mobil `height={220}`, desktop `280`; tek renk paleti `#0f6e56`.

---

### 4. Diğer sekmeler

- **`BekleyenlerTab`:** semantik renk, `DashboardInsetList`, bekleyen şikayet sayısı
- **`OperasyonTab`:** `renkKuyrukSayaci`, temizlik badge
- **`IkTab`:** tüm kartlar `renkEnvanter()`
- **`yonetim-dashboard/OzetTab`:** nöbet “Git” bug → `variant="action"`

---

### 5. Responsive

| Bölge | Mobil | Tablet | Geniş |
|-------|-------|--------|-------|
| Hero | 1 sütun | 2 sütun | 3 sütun |
| Compact | 2 sütun grid | 3 sütun | 5 sütun |
| Grafikler | alt alta | alt alta | 2 sütun |

---

### 6. Test

```bash
cd web && npm run build
pnpm dev:web
```

Manuel: `/admin/ozet` — “Genel istatistikler” başlığı, 3 hero kart, grafik alanı görünür.

---

### 7. Öğrenilenler

- Grafik bileşenleri paylaşılan `ChartCard` ile tekrar kullanılabilir; `raporlar` ve dashboard aynı kabuğu paylaşır.
- Liste panelleri için daha önce yazılmış `DashboardInsetList` devreye alınmalı; her sekmede `<ul>` tekrarı önlenir.
- UX planı uygulandığında alt boşluk sorunu tamamen ortadan kalkar.
