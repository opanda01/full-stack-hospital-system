# Staj Defteri — Gün 10: Hasta PHR Belgeler, Özet API, Mobil Parite ve CI Typecheck

**Tarih:** 31 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS  
**Kapsam:** Birleşik hasta belge listesi (epikriz + onaylı klinik kayıtlar); `GET /hastalar/ben/ozet` ve yatış özeti; tetkik okunma zamanı ve okunmamış sayaç; şikâyet “benim” listesi; mobil Özet/Belgelerim/Reçetelerim/Profil/Şikâyet paritesi; monorepo TypeScript ve GitHub Actions mobil job düzeltmeleri

---

### 1. Günün Amacı

30 Temmuz’da netleşen PHR sözleşmesi 31 Temmuz sabahı tek feature commit’i ile uygulandı; ardından özet randevu filtresinde UTC düzeltmesi ve CI’da kırılan mobil `tsc` zinciri giderildi. Hasta uygulaması, doktor panelinde üretilen **onaylı** klinik belgeleri mobilde görebilir hale geldi; özet hub tek API’den beslenir.

İlgili commit özeti (2026-07-31, kronolojik):

| Saat | Commit | Özet |
|------|--------|------|
| 09:09 | `c8c87c1` | PHR belgeler, özet API, mobil parite, migration 020, testler, Maestro iskelet |
| 09:17 | `9fb4a04` | Özet yaklaşan randevu: UTC karşılaştırması (`as_utc`) |
| 09:24 | `7e4e455` | CI: `@types/react` override, `shared-types` tsc |
| 09:32 | `4094b7c` | `pnpm-lock` / workspace overrides hizası |
| 09:41 | `4956509` | Monorepo genelinde React 19 tip hizalama |
| 09:46 | `b3738d6` | Mobil `tsconfig`: `types` whitelist kaldırıldı (`process` CI hatası) |

**Ölçüm (`c8c87c1`, yaklaşık):** 37 dosya, **+918 / −132** satır.

---

### 2. Backend — PHR Servisi ve Uçlar

#### `phr_service.py` / `phr_schemas.py`

- **`list_benim_belgeler`:** Onaylı epikrizler ile onaylı `KlinikOnayKaydi` kayıtları birleştirilir; `RECETE` / `SEVK` / `TIBBI_RAPOR` için Türkçe başlık; `ozet` alanında içerik kısaltması; tarihe göre azalan sıra; `Page[HastaBelgeRead]`.
- **`hasta_ozet`:** Ad soyad, en yakın randevu (`randevu_service` + `KENDI_KAYDIM`), yaklaşan randevu sayısı, son tetkik meta, `okunmamis_sonuc_sayisi`, iç içe `yatis_ozet`.
- **`yatis_ozet`:** Aktif veya son yatış; servis adı, yatak/oda, protokol, tarihler.

#### Router (`hastalar/router.py`)

| Metot | Yol | Açıklama |
|--------|-----|----------|
| GET | `/hastalar/ben/belgeler` | Birleşik onaylı belgeler (sayfalı) |
| GET | `/hastalar/ben/ozet` | Özet hub DTO |
| GET | `/hastalar/ben/yatis-ozet` | Yatış özeti |

#### İlgili feature genişlemeleri

- **`klinik_onay`:** Hasta oturumunda onaylı kayıtların listelenmesi (test senaryosu ile uyumlu).
- **`sikayet_oneri`:** `GET /sikayet-oneri/benim` — hastanın kendi şikâyet/öneri kayıtları.
- **`tetkikler`:** `hasta_goruldu_at` kolonu (migration **020**); okunmamış sonuçlanmış tetkik sayacı servisi; hasta görüldü işaretleme yolu.
- **`muayeneler` / `randevular`:** PHR ve hasta kapsamı ile uyumlu küçük router/servis ekleri.
- **`permissions.py`:** Hasta klinik onay görüntüleme izni.

**Kazanım:** Hasta tarafında tek belge listesi; özet ekranı backend-odaklı; tetkik bildirim sayacı veri modeline bağlandı.

---

### 3. Migration ve Testler

#### `020_tetkik_hasta_goruldu`

- `tetkikler.hasta_goruldu_at` — `timestamptz`, nullable; hasta sonucu “gördü” zamanı.

#### `test_hasta_phr.py`

- Onaylı klinik belge oluştur → başhekim onayla → hasta `GET /klinik-onay/` ve `GET /hastalar/ben/belgeler` ile görür.
- `GET /hastalar/ben/ozet` alan varlığı.
- Hasta şikâyet oluşturur → `GET /sikayet-oneri/benim` listesinde görünür.

**Doğrulama:** `pytest backend/tests/features/test_hasta_phr.py`; yerelde `alembic upgrade head` (020).

---

### 4. Mobil — Parite ve API Katmanı

#### Özet (`ozet/index.tsx`)

- Tek `hastaOzet` sorgusu; yaklaşan randevu kartı, okunmamış tahlil sayısı, yatış özeti kısayolu; menü linkleri korundu.

#### Belgelerim / Reçetelerim

- `belgelerim/index.tsx` ve `[id].tsx`: birleşik belge listesi ve detay.
- `recetelerim/index.tsx`: onaylı reçete odaklı filtre/görünüm.

#### Diğer

- `profil`, `randevularim`, `sikayet`: API ve query client uyumu (`query/client.ts`).
- `hastaApi.ts` + `packages/shared-types` hasta tipleri.
- `mobile/.maestro/smoke.yaml` — duman testi iskeleti; README notu.

**Kazanım:** Gün 7 PHR IA’sı, gün 10’da onaylı belge ve özet verisiyle tamamlandı.

---

### 5. CI ve Monorepo (TypeScript)

#### Sorun

- `shared-types` ve mobil paketinde `tsc` uyumsuzluğu; `@types/react` sürüm kayması; mobil `tsconfig.json` içindeki `types` whitelist CI’da `process` tanımını düşürüyordu.

#### Çözüm

- Kök `package.json` / `pnpm-workspace.yaml` overrides; `.npmrc` ayarı.
- `packages/shared-types` build/typecheck pipeline’a dahil.
- `.github/workflows/ci.yml`: mobil job’da `shared-types` derlemesi.
- `mobile/tsconfig.json`: gereksiz `types` kısıtı kaldırıldı (`b3738d6`).

**Kazanım:** PR/push sonrası mobil typecheck yeşil; monorepo tek React 19 tip çizgisinde.

---

### 6. Dokümantasyon

- `docs/ROADMAP.md`: hasta PHR maddeleri (özet, belgeler, okunmamış tetkik).
- `docs/rbac-yetki-matrisi.md`: hasta klinik onay görüntüleme ve PHR uçları.

---

### 7. Bilinçli Sınırlar / Sonraki Adımlar

- Belgelerim detayında tüm belge türleri için zengin PDF/print görünümü yok; özet metin ve meta odaklı.
- `hasta_goruldu_at` otomatik set: hasta detay ekranı açılışında tetiklenmeli (mobil UX ince ayarı).
- Doktor paneli PR #27 ile hasta PHR aynı sprintte merge edilmediyse, `main` üzerinde migration 019+020 sırası doğrulanmalı.
- Haftalık `restore-smoke` ve tam yedekten geri yükleme tatbikatı operasyon runbook’ta ayrı izlenir.

---

### 8. Dosya Özeti (ana)

| Alan | Dosyalar |
|------|----------|
| PHR core | `backend/app/features/hastalar/phr_service.py`, `phr_schemas.py`, `router.py` |
| Migration | `backend/alembic/versions/020_tetkik_hasta_goruldu.py` |
| Tetkik | `backend/app/features/tetkikler/models.py`, `service.py`, `schemas.py` |
| Test | `backend/tests/features/test_hasta_phr.py` |
| Mobil | `mobile/app/(hasta)/ozet`, `belgelerim`, `recetelerim`, `mobile/src/shared/api/hastaApi.ts` |
| Shared | `packages/shared-types/src/hasta.ts` |
| CI | `.github/workflows/ci.yml`, `package.json`, `pnpm-workspace.yaml`, `mobile/tsconfig.json` |

---

*Önceki gün: Gün 9 (30 Temmuz) — `docs/reports/2026-07-30/gun-09-entegrasyon-qa-ve-hasta-phr-tasarim.md`*  
*Son commit (gün): `b3738d6`*
