# Staj Defteri — Gün 17

**Tarih:** 7 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Web gösterge paneli ve navigasyon redesign

---

Uzun sidebar yönetim rollerinde modül karmaşası yaratıyordu. Admin/Başhekim/Müdür için gösterge hub: URL'li sekmeler (`/admin/ozet`, bekleyenler, operasyon, …), `DashboardHub`, `QuickLinkGrid`. Domain tabanlı üst navigasyon: `PrimaryNav` (Gösterge, İnsan & erişim, Hasta & klinik, …) + bağlamsal yan menü.

AppShell sadeleştirildi: sticky üst header; pilot rollerde sidebar 200px. Giriş sonrası ana yollar `/admin/ozet`, `/bashekim/ozet`, `/mudur/ozet`. Dokümantasyon: `web/docs/navigation.md`.

**Öğrenilenler:** Gösterge paneli komuta merkezi olmalı; domain navigasyonu uzun menüleri gruplar; üst şerit tekrarlayan başlıkları kaldırarak alan kazandırır; NavLink sekmeler Radix tabs olmadan da erişilebilir olabilir.
