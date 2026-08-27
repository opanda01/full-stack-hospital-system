# Olay Raporu — Mobil Özet ekranı 500 hatası (yatış alan eşlemesi)

**Tarih:** 27 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Kapsam:** Hasta mobil **Özet** sekmesi; `GET /hastalar/ben/ozet`; `phr_service.yatis_ozet`

---

### 1. Belirti

Hasta mobil uygulamada randevu başarıyla oluşturulduktan sonra **Özet** (ana sayfa) sekmesinde:

| Gözlem | Açıklama |
|--------|----------|
| Hata metni | `İstek başarısız (500)` |
| UI | “Yaklaşan randevu yok” (API verisi gelmediği için boş durum) |
| Randevu oluşturma | `POST /randevular/` → **201** (randevu kaydı oluşuyor) |

Kullanıcı randevunun olmadığını düşünebilir; asıl sorun özet API’sinin çökmesidir.

---

### 2. Etkilenen akış

```
Özet sekmesi (mobile/app/(hasta)/ozet/index.tsx)
  └─ fetchOzetSnapshot()
       ├─ GET /auth/me
       └─ GET /hastalar/ben/ozet   ← 500
            └─ phr_service.hasta_ozet()
                 └─ yatis_ozet()   ← AttributeError
```

Mobil istemci `Promise.all` ile iki isteği paralel çalıştırır; özet 500 döndüğünde tüm sorgu başarısız sayılır ve `ErrorText` gösterilir.

---

### 3. Kök neden

`backend/app/features/hastalar/phr_service.py` içindeki `yatis_ozet()` fonksiyonu, `YatisKaydi` modelinde **bulunmayan** `taburcu_tarihi` alanını okumaya çalışıyordu:

```python
# Hatalı
taburcu_tarihi=row.taburcu_tarihi,
```

`YatisKaydi` modelinde (`backend/app/features/yatis/models.py`) çıkış tarihi alanı **`cikis_tarihi`** olarak tanımlıdır. API yanıt şeması (`HastaYatisOzetRead`) mobil için `taburcu_tarihi` adını korur; veri kaynağı `cikis_tarihi` olmalıdır.

**Backend log (Docker):**

```
AttributeError: 'YatisKaydi' object has no attribute 'taburcu_tarihi'
  File ".../phr_service.py", line 130, in yatis_ozet
```

Hata, hastanın en az bir **yatış kaydı** olduğunda tetiklenir (demo seed / yatış modülü verisi). Yatış kaydı olmayan hastalarda özet endpoint’i 200 dönebilir; bu yüzden sorun yalnızca belirli hasta profillerinde görülür.

---

### 4. Düzeltme

**Dosya:** `backend/app/features/hastalar/phr_service.py`

```python
# Doğru eşleme
taburcu_tarihi=row.cikis_tarihi,
```

| Katman | Alan adı | Kaynak |
|--------|----------|--------|
| DB / SQLModel | `cikis_tarihi` | `YatisKaydi` |
| API / mobil DTO | `taburcu_tarihi` | `HastaYatisOzetRead` |

---

### 5. Regresyon testi

**Dosya:** `backend/tests/features/test_hasta_phr.py`

- `test_hasta_ozet_yatis_kaydi_ile`: Yatış kaydı olan hasta için `GET /hastalar/ben/ozet` → **200**, `yatis.aktif_mi` ve `yatis.taburcu_tarihi` doğrulanır.

```bash
cd backend && python -m pytest tests/features/test_hasta_phr.py -q
# 5 passed
```

---

### 6. Operasyon notu — Docker volume senkronu (Windows)

Kod deposunda düzeltme yapılmış olsa bile, `docker-compose` ile çalışan `hastane-backend` konteyneri eski dosyayı çalıştırmaya devam etmiştir (`./backend:/app` bind-mount gecikmesi).

**Doğrulama:**

```bash
docker exec hastane-backend grep taburcu_tarihi /app/app/features/hastalar/phr_service.py
# Beklenen: taburcu_tarihi=row.cikis_tarihi,
```

**Gerekirse:**

```bash
docker cp backend/app/features/hastalar/phr_service.py hastane-backend:/app/app/features/hastalar/phr_service.py
docker restart hastane-backend
```

---

### 7. Doğrulama checklist

- [ ] `GET /health` → 200
- [ ] Hasta OTP oturumu ile `GET /hastalar/ben/ozet` → 200
- [ ] Mobil **Özet** sekmesinde 500 hatası yok
- [ ] Yaklaşan randevu kartı görünüyor (gelecek tarihli aktif randevu varsa)
- [ ] **Randevularım** sekmesinde randevu listeleniyor

Mobil tarafta: Özet sekmesini aşağı çekerek yenileyin; gerekirse uygulamayı tamamen kapatıp OTP ile tekrar giriş yapın.

---

### 8. Değişen dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `backend/app/features/hastalar/phr_service.py` | `cikis_tarihi` → API `taburcu_tarihi` eşlemesi |
| `backend/tests/features/test_hasta_phr.py` | Yatış kayıtlı hasta özet testi |

---

### 9. İlgili referanslar

- PHR özet tasarımı: `docs/reports/2026-07-31/gun-10-hasta-phr-belgeler-ozet-ve-ci.md`
- Hasta OTP kapsam düzeltmesi: `docs/reports/2026-08-05/gun-13-hasta-otp-kapsam-mobil-ux.md`
- Mobil özet ekranı: `mobile/app/(hasta)/ozet/index.tsx`
- Backend endpoint: `GET /hastalar/ben/ozet` → `benim_ozet` (`hastalar/router.py`)
