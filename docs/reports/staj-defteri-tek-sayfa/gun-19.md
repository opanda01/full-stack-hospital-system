# Staj Defteri — Gün 19

**Tarih:** 11 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Plan demo, üst bar navigasyon ve PHR mobil

---

Panates/Probel benzeri demo senaryoları prod entegrasyon olmadan gösterildi. Tüm personel rollerinde sidebar kaldırıldı; `PrimaryNav` + `SecondaryNav` üst şerit navigasyonu. Profil çift sidebar sorunu: rol altı `/…/profil`. Backend demo: laborant/idari/analytics özet API'leri; PHR aşı ve aktif ilaç (`migration 034`); zorunlu bildirim mock BBY outbox.

Web: başhekim analitik Recharts grafikleri; muayene bildirim checkbox'ları. Mobil: aşı takvimi, aktif ilaçlar ekranları. Seed `seed_plan_demo.py`. PR #40.

**Öğrenilenler:** Demo kapsamı mock portlarla güvenli gösterilir; üst bar navigasyon tüm rollerde tutarlılık sağlar; PHR mobil genişlemesi backend endpoint'leriyle eşlenmeli.
