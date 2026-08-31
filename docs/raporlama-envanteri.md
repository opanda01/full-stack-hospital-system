# Raporlama Envanteri — HBYS

**Son güncelleme:** 31 Ağustos 2026  
**Kapsam:** Gün 28–40 raporlama modülü teslimi

## Backend API (`/raporlar`)

| Endpoint | Yetki | Açıklama |
|----------|-------|----------|
| `GET /raporlar/randevu` | `rapor:goruntule` | Tarih aralığı, departman, durum filtreli randevu agregasyonu |
| `GET /raporlar/yatis` | `rapor:goruntule` | Aktif yatış, LOS, servis doluluk, günlük yatış |
| `GET /raporlar/yatak` | `rapor:goruntule` | Yatak durum ve izolasyon dağılımı |
| `GET /raporlar/finans` | `fatura:goruntule` | Fatura durum/tutar, döner sermaye özeti |
| `GET /raporlar/klinik` | `rapor:goruntule` | Tetkik, triyaj, şikayet, epikriz KPI |
| `GET /raporlar/{tur}/export?format=csv\|pdf` | Aynı | Sunucu tarafı dosya üretimi + denetim (web) |

**Roller:** ADMIN (wildcard), BASHEKIM, MUDUR → `rapor:goruntule`; finans için ek `fatura:goruntule`.

## Web

| Sayfa | Route | Veri kaynağı |
|-------|-------|--------------|
| Raporlar merkezi | `/admin/raporlar`, `/bashekim/raporlar`, `/mudur/raporlar` | `/raporlar/*` (sekme: Randevu / Yatış / Finans / Klinik) |

Export öncesi `POST /denetim/dis-aktarim` → `KAYIT_EXPORT`.

## Mobil PHR (hasta)

| Özellik | API | Not |
|---------|-----|-----|
| Özet dayanıklılık | `GET /hastalar/ben/ozet` | Özet hata verirse ekran kısmen yüklenir |
| Yatış geçmişi | `GET /hastalar/ben/yatis-gecmisi` | `yatislarim` ekranı |
| Belge filtreleri | `GET /hastalar/ben/belgeler` | Epikriz / Reçete / Rapor / Sevk sekmeleri |

## Bilinçli kapsam dışı

- BI / OLAP / gece batch
- Zamanlanmış e-posta raporları
- Personel mobil raporlama
- Gerçek MHRS/MEDULA rapor entegrasyonu

## Test

- `backend/tests/features/test_raporlar.py` — auth, JSON, CSV/PDF export
- `backend/tests/features/test_hasta_phr.py` — yatış geçmişi, özet regresyonu
