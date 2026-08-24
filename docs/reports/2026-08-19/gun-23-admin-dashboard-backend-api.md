# Staj Defteri — Gün 23: Admin dashboard backend API genişletmesi

**Tarih:** 19 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Dal:** `feature/plan-uygulama`  
**Kapsam:** `AdminOzet` genişletme; trend (zero-fill) ve servis doluluk endpoint’leri; pytest

---

### 1. Günün Amacı

Gün 22’de çıkarılan planın backend katmanını uygulamak: admin özet tek çağrıda tüm operasyonel sayıları döndürsün; grafikler için günlük trend ve servis bazlı doluluk API’leri eklensin.

| Endpoint | Açıklama |
|----------|----------|
| `GET /dashboard/admin/ozet` | 6 → 13 alan (şikayet, temizlik, yatak, yatış, nöbet, onay bekleyen) |
| `GET /dashboard/admin/trend?gun=7` | `randevu_gunluk` + `yatis_gunluk`, zero-fill |
| `GET /dashboard/admin/servis-doluluk` | Servis başına `dolu/toplam/oran`, tek SQL |

---

### 2. Backend — AdminOzet genişletmesi

**Dosya:** `backend/app/features/dashboard/router.py`

Yeni alanlar SQL `COUNT` ile:

- `sikayet_bekleyen` — `BEKLEYEN_DURUMLAR` (ACIK, INCELENIYOR)
- `temizlik_acik` — durum ∉ (TAMAMLANDI, IPTAL)
- `yatak_dolu` / `yatak_bos` — `YatakDurumu` enum
- `aktif_yatis` — `YatisKaydi.aktif_mi == True`
- `nobet_bugun` — `NobetCizelgesi.tarih == today`
- `randevu_onay_bekleyen` — `Randevu.durum == ONAY_BEKLIYOR`

---

### 3. Backend — trend endpoint (zero-fill)

`GROUP BY DATE(tarih_saat)` kayıtsız günleri döndürmez. `_zero_fill_gunluk()` yardımcısı ile `[bugün-(gun-1) … bugün]` aralığının tamamı `adet: 0` ile tamamlanır.

```python
def _zero_fill_gunluk(rows: dict[date, int], gun: int) -> list[GunlukAdet]:
    bugun = date.today()
    return [
        GunlukAdet(tarih=(bugun - timedelta(days=i)).isoformat(), adet=rows.get(..., 0))
        for i in reversed(range(gun))
    ]
```

Randevu ve yatış için ayrı sorgu; frontend tarih hizalama yapmaz.

---

### 4. Backend — servis doluluk (N+1 yasak)

```sql
SELECT servis.id, servis.ad, COUNT(yatak.id), SUM(CASE WHEN durum='DOLU' THEN 1 ELSE 0 END)
FROM servis LEFT JOIN oda … LEFT JOIN yatak …
GROUP BY servis.id
```

Tek round-trip; servis başına ayrı `/doluluk` çağrısı yapılmaz.

---

### 5. Test

**Dosya:** `backend/tests/features/test_admin_dashboard.py`

- Genişletilmiş özet alanları
- Trend: 7 satır, boş günler `adet: 0`
- Servis doluluk: bilinen seed ile `dolu/toplam/oran`
- Yetki: HEMSIRE/DOKTOR → 403; token yok → 401

```bash
cd backend && python -m pytest tests/features/test_admin_dashboard.py -q
# 8 passed
```

---

### 6. Öğrenilenler

- Dashboard API’lerinde eksik günleri frontend’e bırakmak grafik bug’larına yol açar; zero-fill backend sorumluluğudur.
- Toplu doluluk tek aggregate sorgu ile yapılmalı; N+1 performans ve tutarlılık riski taşır.
- Yetki testleri COUNT testleri kadar önemlidir; admin metrikleri hassas veridir.
