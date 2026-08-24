# Staj Defteri — Gün 24

**Tarih:** 20 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** MetricCard tasarım sistemi ve veri kancası

---

`MetricCard`’a `size` (hero/compact), `kritik` renk ve nötr panel arka planı eklendi; renk yalnızca sol border ile gösteriliyor. `dashboardEsikleri.ts` ile şikayet/randevu/temizlik uyarı-kritik eşikleri tanımlandı; `metricCardSemantics.ts` config tabanlı `renkKritik` kullanıyor.

`useAdminDashboardData` genişletildi: trend, servis doluluk, analytics özet ve `sikayet-oneri/ozet` query’leri. Client-side 200 kayıt temizlik filtresi kaldırıldı. `DashboardGrid`’e `hero` ve `compact` preset’leri eklendi.

**Öğrenilenler:** Eşik değerleri merkezi config’de tutulmalıdır; border semantiği pastel arka plandan daha profesyonel görünür; hook katmanı API değişikliklerini tek noktada toplar.
