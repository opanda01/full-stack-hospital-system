# Staj Defteri — Gün 11: Yatak Yönetimi, Ameliyathane, Orthanc Radyoloji ve Main Birleştirme

**Tarih:** 3 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Kapsam:** Servis/oda/yatak envanteri ve doluluk; ameliyat planlama, takvim ve post-op akışları; PACS (Orthanc) ile radyoloji istem–görüntü bağlantısı; yatış ve PHR ile hizalama; web panelleri; RBAC; migration 021–023; `main` ile merge ve PR [#29](https://github.com/opanda01/full-stack-hospital-system/pull/29)

---

### 1. Günün Amacı

31 Temmuz’da tamamlanan hasta PHR dalı (`feature/hasta-mobil-phr`) üzerine klinik operasyon modülleri eklendi: yatak yönetimi mevcut yatış akışına bağlandı; ameliyathane tetkik/konsültasyon benzeri feature yapısında modellendi; radyoloji için yerel Orthanc konteyneri ve backend istemci katmanı devreye alındı. Gün sonunda `origin/main` fetch edilerek dal güncellendi, çakışan dosyalar çözüldü, testler ve web derlemesi doğrulandı, uzak repoya push ve PR açıldı.

| Saat (yaklaşık) | Commit / iş | Özet |
|-----------------|-------------|------|
| — | `0883f43` | Yatak, ameliyathane, Orthanc radyoloji; 85 dosya (modül + web + docker) |
| — | `cb7168c` | `merge: origin/main into feature/hasta-mobil-phr` — 6 dosyada çakışma çözümü |
| — | Doğrulama | `pytest tests/features` → 121 geçti; `web` `npm run build` başarılı |
| — | PR | [#29](https://github.com/opanda01/full-stack-hospital-system/pull/29) → `main` |

**Not:** Önceki PR [#28](https://github.com/opanda01/full-stack-hospital-system/pull/28) aynı dal adıyla PHR kısmını merge etmişti; #29 dalın güncel commit’lerini (modüller + merge) içerir.

---

### 2. Yatak Yönetimi (`yatak_yonetimi`)

#### Veri modeli (migration **021**)

- `Servis`, `Oda`, `Yatak` tabloları; yatak `durum` enum’u (boş, dolu, rezerve, bakım vb.).
- Mevcut `yatis` kayıtları ile `yatak_id` ilişkisi güçlendirildi; hemşire seed ve güvenlik/temizlik görevleri yatak durumuna uyumlu güncellendi.

#### API (`/yatak-yonetimi` prefix)

| Metot | Yol | İzin (ör.) | Açıklama |
|--------|-----|------------|----------|
| GET | `/servisler` | `servis:goruntule` | Kapsama göre servis listesi |
| GET | `/servisler/{id}/yataklar` | `yatak:goruntule` | Oda/yatak detayları |
| GET | `/servisler/{id}/doluluk` | `servis:goruntule` | Doluluk özeti |
| POST | `/yataklar/ata` | `yatak:ata` | Yatışa yatak atama |

#### Servis mantığı

- `bos_yatak_oner`: servis ve öncelik kurallarına göre boş yatak önerisi (ameliyat sonrası yatış için kullanılır).
- `list_servisler` / doluluk: departman kapsamı (`Kapsam`) ile filtre.

#### Web

- Sayfa: `web/src/pages/ortak/yatak-yonetimi`
- Widget: `YatakHaritasi`; entity `entities/yatak`, feature `yatak-ata`
- Hemşire `servis-takip`: yeni `durum` alanı ile uyum (legacy `dolu_mu` yerine)

**Kazanım:** Yatış ve Servisim ekranları tek yatak envanteri modeline bağlandı; PHR `yatis_ozet` oda/yatak bilgisini `yatak_yonetimi` üzerinden okur.

---

### 3. Ameliyathane (`ameliyathane`)

#### Veri modeli (migration **022**)

- `Ameliyathane`, `AmeliyatPlani`, `AmeliyatEkibi`, `AnesteziKaydi`
- Durum enum’ları: planlandı, devam ediyor, tamamlandı, iptal vb.
- Çekirdek enum tanımları: `backend/app/core/enums.py`

#### İş kuralları (`service.py`)

- **Planlama:** Aynı ameliyathane ve cerrah için zaman çakışması → HTTP 409; farklı odada aynı cerrah aynı slotta yine çakışma (test ile sabitlendi).
- **Başlat / tamamla:** Ameliyathane durumu; tamamlanınca temizlik görevi (`temizlik_gorevleri`) ve epikriz taslağı (`epikriz_service.olustur_taslak_epikriz_ameliyat_sonrasi`).
- **Post-op:** `post_op_yatak_onerisi` → `yatak_yonetimi.bos_yatak_oner`.

#### API (`/ameliyathane`)

- Ameliyathane CRUD (kısıtlı), plan oluştur/güncelle/iptal, takvim (`AmeliyathaneTakvim`), anestezi kaydı, post-op yatak önerisi endpoint’leri.
- İzinler: `ameliyat:goruntule`, `ameliyat:planla`, `ameliyat:yurut` vb. (`permissions.py` + `docs/rbac-yetki-matrisi.md`).

#### Web

- Ortak sayfa: `pages/ortak/ameliyathane` + widget `AmeliyathaneTakvimi`
- Feature: `ameliyat-planla` formu; doktor router’da ameliyathane rotası

#### Test

- `backend/tests/features/test_ameliyathane.py` — oda çakışması, akış, post-op öneri senaryoları

**Kazanım:** Ameliyat operasyonu epikriz ve yatak zincirine bağlandı; web’de takvim görünümü ile planlama.

---

### 4. Radyoloji ve Orthanc (`radyoloji`)

#### Altyapı

- `docker-compose.yml`: `orthanc` servisi (`jodogne/orthanc-plugins:1.12.5`), host **8042** (HTTP), **4242** (DICOM); volume `orthanc_data`
- Backend env: `ORTHANC_URL`, `ORTHANC_USER`, `ORTHANC_PASSWORD` (`.env.example` güncellendi)
- `orthanc_client.py`: sağlık kontrolü, görüntü meta / tarayıcı linki üretimi

#### Veri modeli (migration **023**)

- Radyoloji istem kayıtları; Orthanc study/instance kimlikleri; rapor durumu

#### API (`/radyoloji`)

| Metot | Yol | Açıklama |
|--------|-----|----------|
| GET | `/orthanc/health` | Orthanc erişilebilirlik |
| GET | `/istemler` | Sayfalı istem listesi (kapsam/hasta filtresi) |
| POST | `/istemler` | Yeni istem (doktor) |
| PATCH | `/istemler/{id}/rapor` | Radyolog rapor girişi |
| GET | `/istemler/{id}/goruntu` | Orthanc’ta görüntüleme linki |

#### RBAC

- Yeni rol: **RADYOLOG**; seed kullanıcı `radyolog@hastane.example.com` (`seed_rbac.py`, `seed_radyoloji.py`)

#### Web

- Doktor: radyoloji istem oluşturma (`radyoloji-istem-olustur`), ortak liste sayfası
- Radyolog paneli: `/radyolog` rotası, `RadyologRadyolojiPage`
- Nav: `Scan`, `Scissors` ikonları ile menü girişleri

#### Test

- `backend/tests/features/test_radyoloji.py` — istem oluşturma ve yetki/akış smoke

**Kazanım:** HBYS istem kaydı ile PACS görüntü arasında köprü; geliştirme ortamında tek `docker compose` ile Orthanc.

---

### 5. Epikriz, Yatış ve PHR Entegrasyonu

- **Epikriz:** Ameliyat tamamlanınca otomatik taslak epikriz oluşturma helper’ı; mevcut `create_epikriz` akışı korundu.
- **Yatış:** `yatis/service` yatak atamasında `yatak_yonetimi` servislerini kullanır.
- **PHR:** `phr_service.yatis_ozet` — `main` merge sırasında `phr_service.py` çakışması çözüldü; `yatak_yonetimi` import’ları ve oda/yatak metası branch tarafında bırakıldı, gereksiz tekrarlayan import’lar temizlendi.

---

### 6. Main ile Birleştirme ve Çakışmalar

`git fetch origin` sonrası `git merge origin/main`. Çözülen dosyalar:

| Dosya | Karar |
|-------|--------|
| `backend/app/core/permissions.py` | Yatak, ameliyat, radyoloji izinleri + doktor matrisi korundu |
| `backend/app/features/hastalar/phr_service.py` | Yatak yönetimi ile özet alanları korundu |
| `docs/rbac-yetki-matrisi.md` | Radyoloji ve yeni modül satırları |
| `packages/shared-types/src/index.ts` | `main` yapısı: `./hasta.ts` re-export (OpenAPI dump yerine) |
| `web/src/app/router.tsx` | Doktor ameliyathane + radyoloji rotaları |
| `web/src/shared/config/nav-items.ts` | Yeni menü maddeleri |

---

### 7. Test ve Derleme

| Komut | Sonuç |
|-------|--------|
| `pytest backend/tests/features` | 121 passed |
| `npm run build` (web) | `tsc -b && vite build` başarılı |
| Orthanc (yerel) | `GET localhost:8042/system`, `orthanc_health()` OK |

İlgili yeni/ güncellenen test dosyaları: `test_ameliyathane.py`, `test_radyoloji.py`, `test_yatis.py`, `test_epikriz.py`, `test_ilac_talep.py`, `test_modern_db_hibrit.py` (yatak modeli uyumu).

---

### 8. Bilinçli Sınırlar / Sonraki Adımlar

- Orthanc üretimde TLS, yedekleme ve DICOM modality konfigürasyonu ayrı operasyon konusu; compose şu an geliştirme/demoya yönelik.
- Ameliyathane takvimi web’de temel grid; çakışma UX’i (anlık uyarı) ileride zenginleştirilebilir.
- Radyoloji: gerçek cihazdan C-STORE entegrasyonu ve study eşleme kuralları demo seviyesinin ötesinde tanımlanmalı.
- PR merge sonrası CI ve `restore-smoke` workflow’unun yeşil olduğu doğrulanmalı; migration sırası **019 → 020 → 021 → 022 → 023**.

---

### 9. Dosya Özeti (ana)

| Alan | Dosyalar |
|------|----------|
| Yatak | `backend/app/features/yatak_yonetimi/*`, `021_yatak_yonetimi.py`, `seed_yatak_yonetimi.py` |
| Ameliyathane | `backend/app/features/ameliyathane/*`, `022_ameliyathane.py`, `seed_ameliyathane.py` |
| Radyoloji | `backend/app/features/radyoloji/*`, `023_radyoloji.py`, `orthanc_client.py`, `seed_radyoloji.py` |
| Docker | `docker-compose.yml` (`orthanc` + backend env) |
| Epikriz | `backend/app/features/epikriz/service.py` (ameliyat sonrası taslak) |
| RBAC | `permissions.py`, `enums.py`, `docs/rbac-yetki-matrisi.md` |
| Web | `pages/ortak/yatak-yonetimi`, `ameliyathane`, `radyoloji`; `widgets/ameliyathane-takvimi`, `yatak-haritasi`; `entities/*` |
| Test | `test_ameliyathane.py`, `test_radyoloji.py` |

---

*Önceki gün: Gün 10 (31 Temmuz) — `docs/reports/2026-07-31/gun-10-hasta-phr-belgeler-ozet-ve-ci.md`*  
*Son commit (gün): `cb7168c` (merge); özellik commit: `0883f43`*
