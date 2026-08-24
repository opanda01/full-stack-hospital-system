# Staj Defteri — Gün 20

**Tarih:** 12 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Nav hizası, toplu seed, nöbet silme ve kullanıcı filtre

---

Gösterge paneli alt sekme yerleşimi tüm modüllere yayıldı: `SecondaryNav` içerik alanı üstünde (Gösterge ile aynı his). Profil URL düzeltmesi: `roleRootForRole` → `/admin/profil` (önceki `/admin/ozet/profil` 404).

Toplu personel seed: `seed_personel_toplu` — 11 rol × 50 = 550 kayıt; Docker entrypoint idempotent. Nöbet çizelgesi: Trash2 silme butonu, DnD silme alanı (`NobetSilmeAlani`), `DELETE /nobet-cizelgesi/{id}`. Kullanıcı listesi sunucu tarafı `rol` + `aktif_mi` filtreleri (önce istemci filtresi boş liste veriyordu).

**Öğrenilenler:** Alt navigasyon tutarlılığı UX'te önemli; profil URL rol kökünden türetilmeli; demo ortamı için toplu seed otomatik çalışmalı; liste filtreleri sunucu tarafında yapılmalı.
