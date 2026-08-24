# Staj Defteri — Gün 23

**Tarih:** 19 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Konu:** Admin dashboard backend API genişletmesi

---

`backend/app/features/dashboard/router.py` güncellendi. `AdminOzet`’e şikayet bekleyen, temizlik açık, yatak dolu/boş, aktif yatış, nöbet bugün ve randevu onay bekleyen alanları SQL COUNT ile eklendi.

`GET /dashboard/admin/trend?gun=7` — randevu ve yatış günlük dizileri; `_zero_fill_gunluk()` ile kayıtsız günler `adet: 0`. `GET /dashboard/admin/servis-doluluk` — `GROUP BY servis_id` tek aggregate sorgu. `test_admin_dashboard.py`: 8 test (COUNT, zero-fill, 401/403).

**Öğrenilenler:** Grafik API’lerinde zero-fill backend sorumluluğudur; toplu doluluk N+1 yerine tek sorgu ile yapılmalıdır; admin metrikleri için yetki testleri zorunludur.
