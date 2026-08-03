# Staj Defteri — Gün 5: Modern Hibrit DB, Yasal/Klinik Uyum ve Liste Pagination

**Tarih:** 24 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS  
**Kapsam:** Modern hibrit veritabanı (eşzamanlılık, denetim, İstanbul TZ); PHI `public_id` UUID; yasal/klinik uyum (alerji–reçete, KVKK/PHI şifreleme, entegrasyon mock, backup, ICD/lab); liste API pagination + yatış N+1 azaltma; alembic/web hotfix’leri

---

### 1. Günün Amacı

Gün 1–4’te iskelet, auth/RBAC, rol panelleri ve hasta mobil istemci oturduktan sonra gün 5’te odak **altyapı sertleştirme + yasal/klinik uyum + ölçeklenebilir listeler** oldu. Tek bir feature günü yerine ardışık PR’larla DB concurrency, dış kimlik modeli, Faz L–P uyum paketi ve `Page[T]` pagination aynı günde main’e alındı.

İlgili commit / PR özeti (2026-07-24, kronolojik):

| Saat | Commit | PR | Özet |
|------|--------|-----|------|
| 09:46 | `a7b4aea` | [#17](https://github.com/opanda01/full-stack-hospital-system/pull/17) | Modern hibrit DB — concurrency, audit, Istanbul TZ |
| 10:26 | `94d64fb` | — | README başlık sadeleştirme |
| 11:13 | `067c484` | [#20](https://github.com/opanda01/full-stack-hospital-system/pull/20) | PHI tablolarına `public_id` UUID; dış API ≠ integer PK |
| 11:43 | `70a22bf` | [#21](https://github.com/opanda01/full-stack-hospital-system/pull/21) | Yasal/klinik uyum — alerji, KVKK/PHI, entegrasyon, backup, ICD/lab |
| 12:38 | `5dc2cbd` | — | Liste API pagination, batch preload yatış, Vite `/api` proxy |
| 13:15 | `2d4acc0` | — | Denetim sayfasında kullanılmayan import temizliği |
| 13:21 | `c44bce9` | — | Alembic 012 MHRS idempotency SQL `:create` bind escape |

**Ölçüm (yaklaşık):** 7 commit; ~**+7673 / −1543** satır; Alembic `012`–`017`; ROADMAP Faz L–P işlendi.

---

### 2. Modern Hibrit DB — Concurrency, Audit, Istanbul TZ (#17)

#### Tasarım ilkesi

ORM CRUD korunur; kritik yazımlarda atomik SQL / partial unique / idempotency ile yarış güvenliği sağlanır. “Hibrit” = klasik feature service + seçilmiş DB seviyesinde sertleştirme.

#### Backend (migration `012_modern_db_hibrit`)

- **Yatış / randevu / stok:** atomik yazım; çakışmada 409.
- **MHRS:** `idempotency_key` ile tekrar gönderim güvenliği; aynı key farklı payload → 422.
- **Denetim:** partition’lı append-only model; immutability / PHI trigger’ları; detay erişimi `denetim:detay` (yalnız ADMIN).
- **PII maskeleme:** `audit_mask` ile denetim detayında hassas alanların süzülmesi.
- **Redis cache + SQL COUNT özetler:** rol dashboard’ları `/dashboard/*/ozet`.
- **Timezone:** randevu saklama UTC `TIMESTAMPTZ`; API/UI `Europe/Istanbul` (3 saat kayma düzeltmesi).
- **Pool / PITR:** `docs/runbooks/db-ops.md` eklendi (PgBouncer transaction pooling, Alembic 012 cutover, WAL/PITR hedefleri).

#### Web / mobil

Randevu kartları ve formlarda İstanbul gösterimi; admin / doktor / hemşire dashboard’ları özet endpoint’lerine bağlandı.

#### Test

`backend/tests/features/test_modern_db_hibrit.py` — concurrency, MHRS idempotency, timezone smoke.

**Kazanım:** Klinik yarış senaryoları (çift yatak nakli, aynı slot randevu) ve denetim gizliliği DB/API katmanında netleşti; operasyon runbook’u cutover riskini yazılı hale getirdi.

---

### 3. PHI `public_id` UUID — Dış Kimlik Ayrımı (#20)

#### Problem

Hasta / randevu / tetkik için dışarıya sızan sıralı integer id’ler tahmin edilebilirlik ve IDOR riski taşır.

#### Çözüm (migration `013_public_id_phi`)

| Katman | Kimlik |
|--------|--------|
| İç PK / FK / audit `kaynak_id` | Integer (değişmez) |
| Dış API (web / mobile) | `public_id` (UUID) |
| Hasta audit trigger | `detay.hasta_public_id` yazar; ham TC yok |

- Yardımcı: `backend/app/core/public_id.py`
- Router/service/schema zinciri hastalar, randevular, tetkikler ve türev klinik feature’larda UUID’ye geçirildi.
- Web entity tipleri + mobile randevu/tetkik ekranları güncellendi.
- `#17` sonrası `main` merge conflict’leri aynı PR’da çözüldü; randevu service `IndentationError` hotfix’i commit mesajında geçiyor.

**Kazanım:** Dış yüzey tahmin edilemez kimlik kullanır; iç FK ve denetim bütünlüğü bozulmaz. Runbook’a Alembic 013 notları eklendi.

---

### 4. Yasal / Klinik Uyum — Faz L–P (#21)

Tek PR ile ROADMAP **Faz L–P** uygulandı (migration `014`–`016`).

#### Faz L — Klinik güvenlik (alerji / reçete)

- Yapılandırılmış `recete_kalemleri`, `hasta_alerjileri`, DDI seed.
- **Hard-stop:** SIDDETLI / ANAFILAKSI / KONTRANDIKE — break-glass yok.
- HAFIF / ORTA için `RECETE_UYARI_OVERRIDE`.
- Doktor muayene UI: alerji rozeti, reçete kalem, hard-stop / uyarı overlay.
- Test: `test_recete_guvenlik.py`.

#### Faz M — KVKK + PHI şifreleme

- Versiyonlu `kvkk_metinleri` / `kvkk_onay_kayitlari`.
- AES-GCM + ayrı HMAC blind index (`crypto.py`).
- Backfill: `scripts/phi_encrypt_backfill.py` (`skip_hasta_audit` + `PHI_ENCRYPT_BACKFILL`).
- Celery `phi_retention.anonimlestir`.

#### Faz N — Entegrasyon portları (mock)

- `EnabizPort` / `MedulaPort` / `KpsPort`; `ENTEGRASYON_BACKEND=mock|live`.
- Fatura `POST /faturalar/{id}/medula-gonder`; outbox tablosu.
- Başhekim entegrasyon senkron paneli + faturalandırma MEDULA mock.

#### Faz O — Headers + backup

- `SecurityHeadersMiddleware` (CSP / X-Frame-Options vb.).
- Compose `postgres-backup` (günlük `pg_dump`, 7 gün volume).
- Haftalık CI: `.github/workflows/restore-smoke.yml`; lokal `scripts/restore-smoke.sh` / `.ps1`.

#### Faz P — ICD-10 + lab kalemleri

- `icd10_kodlari`, `muayene_tani_kodlari`, `tetkik_sonuc_kalemleri`.
- `GET /tetkikler/trend`.

**Dokümantasyon:** `docs/ROADMAP.md` L–P; `docs/integrations/README.md`; `db-ops.md` backup / PHI backfill bölümleri.

**Kazanım:** Staj kapsamındaki “yasal + klinik güvenlik + ops yedek” iskeleti tek günde dikey slice olarak main’e girdi; live Bakanlık entegrasyonu port arkasında bilinçli bırakıldı.

---

### 5. Liste Pagination + Yatış Batch Preload (`5dc2cbd`)

#### Backend

- Ortak `Page[T]` (`backend/app/core/pagination.py`).
- Composite index migration `017_list_pagination_indexes`.
- Geniş feature yüzeyi: hastalar, randevular, tetkikler, muayeneler, güvenlik, eczane, fatura, yatış, ilaç talep, denetim, vb.
- `batch_load` ile yatış okumalarında N+1 azaltma; `test_yatis_n1.py` eklendi.

#### Web / mobil

- `shared/lib/pagination` + `ListPager` UI.
- Admin / başhekim / doktor / hemşire / güvenlik / ortak listelerde unwrap + sayfalama.
- Dev web: Vite `/api` proxy varsayılan (`.env.development`).

#### Hotfix’ler (aynı gün)

- `2d4acc0` — denetim sayfasında kullanılmayan `LOOKUP_PAGE_SIZE` import’u.
- `c44bce9` — Alembic 012’de MHRS SQL `:create` bind escape (migration çalıştırma hatası).

**Kazanım:** Büyük listeler varsayılan olarak sayfalanır; UI panelleri yeni `Page` şekline uyarlandı; yatış paneli için ölçülebilir N+1 testi eklendi.

---

### 6. Küçük Dokümantasyon

- `94d64fb` — README başlığı kurum adından sade “Devlet Hastanesi — HBYS” formuna çekildi (marka/repo açıklaması).

---

### 7. Dokümantasyon ve Operasyon Çıktıları

| Dosya / artefakt | Rol |
|------------------|-----|
| `docs/runbooks/db-ops.md` | 012/013 cutover, PITR, backup, PHI backfill |
| `docs/integrations/README.md` | Mock/live portlar |
| `docs/ROADMAP.md` | Faz L–P maddeleri |
| `.github/workflows/restore-smoke.yml` | Haftalık restore tatbikatı |
| `docker-compose.yml` | `postgres-backup` servisi |
| `backend/.env.example` | PHI / entegrasyon / pool bayrakları |

---

### 8. Sonraki Adımlar

1. `alembic upgrade head` (012–017) lokal/staging’de cutover checklist ile doğrulama.  
2. Pagination sonrası kalan UI edge-case’leri (filtre + sayfa reset, boş sayfa).  
3. PHI encrypt backfill’i düşük trafikli pencerede çalıştırıp `PHI_ENCRYPT_ENABLED=true`.  
4. Recete hard-stop / override senaryolarının QA checklist’e işlenmesi.  
5. Live entegrasyon (`ENTEGRASYON_BACKEND=live`) için credential ve outbox retry politikası.  
6. Gün içinde commit edilmemiş web randevu/tetkik sayfa dokunuşlarının (WIP) review + commit.

---

### Öğrenilenler

- **Hibrit DB:** Her yazımı raw SQL’e çevirmek gerekmiyor; yarış noktalarını (yatak, slot, stok, MHRS) seçip atomik kılmak yeterli ve review edilebilir.  
- **İç/dış kimlik ayrımı:** UUID’yi PK yapmak yerine `public_id` eklemek migration ve audit’i sade tutuyor.  
- **Uyum paketi dikey slice:** Alerji–reçete + KVKK + entegrasyon + backup aynı PR’da gidince ROADMAP Faz L–P “uygulandı” demek anlamlı; parçalı bırakmak entegrasyon borcu üretir.  
- **Pagination erken standart:** `Page[T]` + `ListPager` bir kez oturunca onlarca liste ekranı aynı desende güncellenebiliyor.  
- **Migration SQL bind tuzağı:** Alembic/SQLAlchemy `:create` gibi token’ları escape etmezsen cutover kırılır; hotfix’in aynı gün gelmesi doğru idi.

---

*Bu rapor, 24.07.2026 tarihli git geçmişi (PR #17, #20, #21 ve aynı günkü pagination/hotfix commit’leri) ile `docs/ROADMAP.md` Faz L–P maddeleri esas alınarak hazırlanmıştır.*
