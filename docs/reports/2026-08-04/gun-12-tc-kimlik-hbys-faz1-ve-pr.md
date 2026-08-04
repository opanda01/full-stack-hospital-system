# Staj Defteri — Gün 12: TC Kimlik Doğrulama, Devlet HBYS Faz 1 ve PR #30

**Tarih:** 4 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS (Çanakkale Mehmet Akif Ersoy Devlet Hastanesi)  
**Kapsam:** TC kimlik checksum (algoritmik, KPS/NVI hariç); `docs/ROADMAP.md` Devlet HBYS uyum yol haritası; Faz 1 kritik maddeler (MAR, lab panic, MPI, KPS, zorunlu bildirim, OTP IP limit, veli/vasi onam, acil rızasız iki hekim); Alembic **024–028**; web/mobil form UX; PR [#30](https://github.com/opanda01/full-stack-hospital-system/pull/30); `main` merge çakışması ve CI düzeltmesi; GitHub repo About topic’leri

---

### 1. Günün Amacı

3 Ağustos’ta yatak, ameliyathane ve radyoloji modülleri `main`’e girmişti (#29). 4 Ağustos’ta odak **kimlik ve hasta güvenliği** ile **mevzuata yakın minimum backend kapıları** oldu: rastgele TC ile kayıt engeli; gap analizine dayalı Faz 1 maddelerinin kodlanması; değişikliklerin tek PR’da toplanması ve CI’nin yeşile dönmesi.

| Saat (yaklaşık) | Commit / iş | Özet |
|-----------------|-------------|------|
| — | `a805379` | TC checksum: `app/core/tc_kimlik.py`, Pydantic tipleri, auth/hasta/personel/guvenlik şemaları, web `tc-kimlik.ts`, mobil `tcKimlik.ts`, `test_tc_kimlik.py` |
| — | Dokümantasyon | `docs/ROADMAP.md` — “Devlet HBYS uyum yol haritası (2026)”, Faz 1–3; veli/vasi ve acil rıza gap taraması |
| — | `30ec29a` | Faz 1 backend: MAR, lab panic, MPI, KPS, bildirim bayrakları, OTP IP middleware, veli/vasi, `ACIL_RIZASIZ`; migration 024–028; feature testleri |
| — | PR | [#30](https://github.com/opanda01/full-stack-hospital-system/pull/30) açıldı (`feature/tc-kimlik-dogrulama`) |
| — | Repo | GitHub About: açıklama + 20 tech topic (FastAPI, Expo, HBYS, KVKK vb.) |
| — | `3e6be49` | `merge origin/main` — 3 staj raporunda proje adı çakışması çözüldü |
| — | CI | `test_auth_register_hasta` 422 → geçerli TC; `8218cc0` |

---

### 2. TC Kimlik Algoritmik Doğrulama

#### Çekirdek

- `backend/app/core/tc_kimlik.py`: `gecerli_tc_kimlik_no`, `TcKimlikNo` / `TcKimlikNoOpsiyonel`, test yardımcısı `tc_ilk_dokuz_haneden`
- Pydantic 422 yanıtlarında `ctx` JSON uyumu: `app/core/errors.py`

#### Entegrasyon

- Auth: OTP gönder/doğrula, hasta `/auth/register`
- Hasta, kullanıcı, personel şemaları; personel CSV import; mock KPS test verisi **değiştirilmedi** (yalnızca doğrulama katmanı)

#### İstemci

- Web: `web/src/shared/lib/tc-kimlik.ts` — kayıt, giriş, personel, hasta kayıt, ziyaretçi formları
- Mobil: `mobile/src/shared/lib/tcKimlik.ts`

**Kazanım:** NVI/KPS olmadan bile sahte 11 haneli numaraların API’ye düşmesi engellendi; KPS zorunluluğu ayrı config ile Faz 1’de bağlandı.

---

### 3. Devlet HBYS Uyum — Faz 1 (Kritik)

`docs/ROADMAP.md` içinde Faz 1 maddelerinin tamamı işaretlendi. Özet:

| # | Madde | Teknik özet |
|---|--------|-------------|
| 1 | MAR güvenlik | `klinik_service` ilaç uygulama → `uygula_veya_engelle(..., baglam="MAR")`; `test_mar_guvenlik.py` |
| 2 | Lab panic | `panic_min/max`, `panic_mi`; migration **024**; `KRITIK_LAB` panel bildirimi; `test_lab_panic.py` |
| 3 | MPI iskeleti | `mukerrer-adaylar`, merge istek/onay; `merged_into_hasta_id`; **025**; `test_mpi.py` |
| 4 | KPS kayıt | `kps_dogrulama.py` → OTP KAYIT + `create_hasta_with_user`; `test_kps_kayit.py` |
| 5 | Zorunlu bildirim | Muayene bayrakları + `ZORUNLU_BILDIRIM_ISARET` denetim; **026**; `test_zorunlu_bildirim.py` |
| 6 | OTP/login limit | Middleware `/auth/otp/gonder` + `/auth/otp/dogrula` IP limiti; `test_otp_ip_rate_limit.py` |
| 7 | Veli/vasi | `HastaYasalTemsilci`, KVKK onam kapısı (18 altı / ehliyet kısıtlı); **027**; `test_veli_vasi.py` |
| 8 | Acil rızasız | `tur=ACIL_RIZASIZ`, ikinci hekim, bilgilendirme endpoint’i; **028**; `test_acil_rizasiz.py` |

Yardımcı: `app/core/yas.py` (`resit_mi`, `yas_hesapla`).

**Kazanım:** BBY/MEDULA öncesi minimum denetim izi ve klinik güvenlik boşlukları kapatıldı; Faz 2 (MEDULA, MHRS, triyaj…) roadmap’te bekliyor.

---

### 4. Pull Request ve Birleştirme

- Dal: `feature/tc-kimlik-dogrulama`
- Hedef: `main`
- PR: [#30](https://github.com/opanda01/full-stack-hospital-system/pull/30)

`origin/main` merge sonrası çakışan dosyalar (yalnızca metadata):

| Dosya | Karar |
|-------|--------|
| `docs/reports/2026-07-29/gun-08-doktor-panel-kurumsal-ui.md` | Tam hastane adı (`main` satırı) |
| `docs/reports/2026-07-30/gun-09-entegrasyon-qa-ve-hasta-phr-tasarim.md` | Aynı |
| `docs/reports/2026-07-31/gun-10-hasta-phr-belgeler-ozet-ve-ci.md` | Aynı |

PR durumu merge sonrası **MERGEABLE**; CI’da tek kırmızı: `test_rbac.py::test_auth_register_hasta` (sabit `88888888881` artık geçersiz TC).

---

### 5. Test ve CI Düzeltmesi

| Sorun | Çözüm |
|-------|--------|
| `POST /auth/register` → 422 | Testte `tc_ilk_dokuz_haneden("960000001")` |
| Commit | `8218cc0` — `test: hasta register icin gecerli TC checksum kullan` |

Yerel doğrulama (Faz 1 paketi): `test_zorunlu_bildirim`, `test_veli_vasi`, `test_acil_rizasiz`, `test_yas` — 7/7 geçti (önceki oturum).

Önerilen tam backend koşusu (CI ile uyumlu):

```bash
cd backend && python -m pytest tests/features -q
```

---

### 6. GitHub Repo About

`gh repo edit` ile kısa HBYS monorepo açıklaması ve topic kutucukları: `fastapi`, `react`, `expo`, `sqlmodel`, `alembic`, `hbys`, `kvkk`, `turborepo`, `feature-sliced-design` vb. (toplam 20).

---

### 7. Bilinçli Sınırlar / Sonraki Adımlar

- MPI merge onayı sonrası FK taşıma ve tam birleştirme Faz 2+.
- Zorunlu bildirim bayrakları BBY/e-Nabız gönderim zinciri olmadan yalnızca işaretleme + denetim.
- Veli/vasi: web/mobil onboarding UI henüz minimal; API ve KVKK kapısı hazır.
- PR #30 merge sonrası production’da `alembic upgrade head` (**024 → 028** sırası).
- Faz 2: MEDULA provizyon, MHRS iki yönlü, triyaj, no-show (`docs/ROADMAP.md`).

---

### 8. Dosya Özeti (ana)

| Alan | Dosyalar |
|------|----------|
| TC kimlik | `backend/app/core/tc_kimlik.py`, `tests/core/test_tc_kimlik.py`, web/mobil tc lib |
| Faz 1 core | `kps_dogrulama.py`, `yas.py`, `login_rate_limit.py` |
| Hastalar | `mpi_service.py`, `mpi_models.py`, `yasal_temsilci_*` |
| Klinik | `muayeneler/service.py`, `tetkikler/service.py`, `yatis/klinik_service.py`, `klinik_onay/router.py` |
| Migrasyon | `024_lab_panic.py` … `028_acil_rizasiz.py` |
| Dokümantasyon | `docs/ROADMAP.md` |
| Test | `test_mar_guvenlik.py`, `test_lab_panic.py`, `test_mpi.py`, `test_kps_kayit.py`, `test_zorunlu_bildirim.py`, `test_otp_ip_rate_limit.py`, `test_veli_vasi.py`, `test_acil_rizasiz.py`, `test_rbac.py` (register TC) |
| Staj | Bu dosya |

---

*Önceki gün: Gün 11 (3 Ağustos) — `docs/reports/2026-08-03/gun-11-yatak-ameliyathane-radyoloji-ve-pr.md`*  
*Son commit (gün): `8218cc0`; özellik commitleri: `a805379`, `30ec29a`; PR: [#30](https://github.com/opanda01/full-stack-hospital-system/pull/30)*
