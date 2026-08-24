# Staj Defteri — Gün 22: Admin gösterge paneli UX analizi ve iyileştirme planı

**Tarih:** 18 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Kapsam:** Admin Özet sekmesi kullanılabilirlik incelemesi; KPI hiyerarşisi, semantik renk ve veri bağlamı gereksinimleri

---

### 1. Günün Amacı

Gün 17–18’de hub yapısına geçilmiş olmasına rağmen admin özet sekmesi hâlâ sekiz eşit KPI kartından oluşuyor ve alt bölge boş kalıyordu. Danışman geri bildirimi ve kendi gözlemimle panelin “yarım kalmış” hissi verdiği tespit edildi. Bugün kod yazımından çok **sorun analizi ve uygulama planı** üretildi.

| Sorun | Etki |
|-------|------|
| Dekoratif renk döngüsü (`RENK[i % 4]`) | Kırmızı/yeşil anlam taşımıyor; gerçek alarm kayboluyor |
| 8 eşit kart | Bekleyen randevu ile toplam kullanıcı aynı ağırlıkta |
| Bağlamsız sayılar | Trend, oran, sparkline yok |
| Alt yarım boş | Grafik ve aktivite akışı eksik |
| “Nöbet: Git” metni | `MetricCard` `variant="action"` kullanılmamış (bug) |
| Client-side 200 kayıt filtresi | Temizlik/randevu sayıları güvenilmez |

---

### 2. Hedef mimari (plan)

```
Hero KPI (3 kart) → Bekleyen randevu, şikayet, temizlik
Compact şerit → Kullanıcı, doktor, departman, hasta, personel
Grafikler → Haftalık trend, servis doluluk, yatak özeti
Listeler → Son şikayetler, bekleyen randevular
```

Semantik renk: yalnızca durum bildiren yerlerde (kritik=kırmızı, uyarı=amber, nötr=gri). Eşik değerleri `dashboardEsikleri.ts` config dosyasında toplanacak.

---

### 3. Backend gereksinim analizi

Mevcut `GET /dashboard/admin/ozet` yalnızca 6 sayaç döndürüyor. Planlanan genişletme:

- `sikayet_bekleyen`, `temizlik_acik`, `yatak_dolu/bos`, `aktif_yatis`, `nobet_bugun`, `randevu_onay_bekleyen`
- `GET /dashboard/admin/trend?gun=7` — zero-fill günlük dizi (boş günler `adet: 0`)
- `GET /dashboard/admin/servis-doluluk` — tek aggregate sorgu (`GROUP BY servis_id`)

Yetkilendirme: mevcut `personel:listele` guard’ı ile tutarlı; testlerde 401/403 senaryoları.

---

### 4. Frontend gereksinim analizi

- `MetricCard`: `size` (`hero` / `compact`), `kritik` renk, ikon gizleme kuralları
- `DashboardGrid`: `cols="hero"` ve `cols="compact"` preset’leri
- Yeni bileşenler: `AdminTrendChart`, `ServisDolulukChart`, `BekleyenIslerPanel`
- `ChartCard` paylaşılan modüle taşınacak (`raporlar` sayfasından extract)

---

### 5. Çıktılar

- Yazılı iyileştirme planı (katmanlı düzen, API, test, responsive breakpoint tablosu)
- Ekran görüntüsü ile mevcut vs hedef karşılaştırma notları
- Ertesi gün için backend görev listesi hazırlandı

---

### 6. Öğrenilenler

- Hastane yönetim panellerinde renk **dekorasyon değil durum dili** olmalıdır.
- KPI hiyerarşisi operasyonel alarm ile arka plan istatistiğini ayırmadan panel güven vermez.
- Plan aşamasında zero-fill ve N+1 sorgu yasağı gibi teknik kısıtlar önceden yazılmalıdır.
