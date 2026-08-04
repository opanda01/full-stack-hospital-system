# Staj Defteri — Gün 6: Mobil OTP / LAN API, Web Lookup ve Liste PR Birleştirme

**Tarih:** 27 Temmuz 2026  
**Proje:** Devlet Hastanesi HBYS  
**Kapsam:** Cuma (24.07) WIP’inin `main`’e alınması; Expo Go’da LAN API çözümlemesi; development OTP (`gelistirme_kodu`); güvenli oturum depolama; web randevu/tetkik lookup `LOOKUP_PAGE_SIZE` + admin `ListPager`

---

### 1. Günün Amacı

Gün 5’te modern DB, yasal/klinik uyum ve `Page[T]` pagination iskeleti main’e girmişti; ancak mobil OTP geliştirme deneyimi, fiziksel cihazda API erişimi ve bazı web liste/lookup ekranları hâlâ feature branch’te kalmıştı. Gün 6’da odak **yeni büyük feature açmak değil**, bu WIP’i review edip [#23](https://github.com/opanda01/full-stack-hospital-system/pull/23) ile `main`’e almak ve hasta mobil smoke yolunu (Expo Go + demo OTP) tekrar doğrulanabilir hale getirmek oldu.

| Saat (yaklaşık) | İş | Özet |
|-----------------|-----|------|
| Sabah | PR review / merge | `feature/read-list-scaling` → `main` (#23) |
| — | Mobil | `resolveApiUrl`, SecureStore, OTP auto-fill (`gelistirme_kodu`) |
| — | Backend | Dev OTP yanıt alanı; demo hasta seed idempotent |
| — | Web | Randevu/tetkik lookup `LOOKUP_PAGE_SIZE`; admin randevu `ListPager` |

**Ölçüm (PR #23 diff özeti):** ~**+280 / −67** satır (mobil OTP + web lookup commit’i); pagination çekirdeği Cuma’da ayrıca #22 ile geçmişti.

---

### 2. PR #23 — Ne Birleştirildi?

PR başlığı: *liste pagination, mobil OTP girişi ve web lookup düzeltmeleri*.

Üç katman aynı PR’da kapandı:

1. **Liste ölçekleme (Cuma’dan kalan istemci yüzeyi)** — paginated `Page[T]` yanıtlarına web/mobil unwrap; admin randevularda `ListPager`.
2. **Mobil geliştirme ergonomisi** — LAN/Expo API URL çözümlemesi, development OTP kodunun UI’ya dönmesi, güvenli token saklama.
3. **Web lookup tutarlılığı** — doktor / hemşire / laborant randevu–tetkik sorgularında sabit sayfa boyutu (`LOOKUP_PAGE_SIZE`).

Gün 5 raporunda pagination mimarisi (`Page[T]`, migration `017`, yatış N+1) zaten anlatıldığı için bu günde tekrarlanmadı; odak **mobil + lookup kapanışı**.

---

### 3. Mobil — LAN API ve OTP Geliştirme Akışı

#### Problem

Fiziksel telefonda Expo Go ile `localhost:8000` çalışmaz; emülatörde `10.0.2.2`, LAN’da makine IP’si gerekir. Ayrıca SMS stub ortamında OTP kodu konsola düşüyordu; her denemede elle kopyalamak smoke’u yavaşlatıyordu.

#### Çözüm

| Parça | Dosya / davranış |
|-------|------------------|
| API URL | `mobile/src/shared/api/resolveApiUrl.ts` — `EXPO_PUBLIC_API_URL` doluysa onu kullan; boş/localhost ise Metro `hostUri` LAN IP + `:8000`; Android emülatör fallback `10.0.2.2` |
| Hata mesajı | `otpGonder` / `otpDogrula` ağ hatasında çözülen URL’yi gösteren Türkçe mesaj |
| Dev OTP | Backend `otp/gonder` yanıtına `gelistirme_kodu` (yalnız development); giriş/kayıt formları alanı otomatik doldurur |
| Oturum | `mobile/src/shared/auth/storage.ts` — SecureStore ile token hydrate |
| Seed | Demo hasta (`10000000006` / `05551234567`) seed idempotent hale getirildi |
| Env | `mobile/.env.example` — LAN IP örneği; boş bırakınca Metro LAN kullanımı notu |

**Kazanım:** Aynı Wi‑Fi’deki telefonda Expo Go → OTP → hasta paneli zinciri, konsola bakmadan ve sabit IP ezberlemeden tekrarlanabilir.

---

### 4. Web — Lookup ve Liste Uyumu

Pagination sonrası bazı ekranlar hâlâ sınırsız / varsayılan liste çağrısı yapıyordu; lookup’lar büyük yanıtlarda kırılganlaşıyordu.

- `useRandevular` ve ilgili doktor / hemşire / laborant sayfalarında `LOOKUP_PAGE_SIZE` ile sınırlı sorgu.
- Admin randevular: unwrap + `ListPager` (sayfa gezintisi).
- Hemşire panel özet/liste çağrıları paginated şekle uyarlandı.

**Kazanım:** Rol panelleri Gün 5’teki `Page[T]` sözleşmesiyle hizalandı; lookup çağrıları “tüm kayıtları çek” riskinden çıktı.

---

### 5. Backend — Küçük Destek Değişiklikleri

- Auth şema/servis: development’ta OTP yanıtına `gelistirme_kodu` (production’a sızmaz).
- `seed_rbac`: demo hasta tekrar seed’de çakışma üretmeyecek şekilde düzenlendi.

Bu değişiklikler yeni endpoint açmadı; mobil smoke ve demo hesabı için destekledi.

---

### 6. Dokümantasyon

- Gün 5 teknik raporu (`docs/reports/2026-07-24/...`) aynı PR paketinde `main`’e taşındı (Cuma’da yazılmıştı).
- Bu dosya: 27.07 staj defteri kaydı (Gün 6).

---

### 7. Sonraki Adımlar

1. Expo Go smoke checklist: OTP gönder → otomatik kod → randevu liste/iptal → tetkik sonuçları.  
2. Windows / kurumsal ağda `:8000` firewall kısıtı varsa Metro üzerinden API proxy (dev UX) değerlendirmek.  
3. Pagination sonrası kalan UI edge-case’ler (filtre + sayfa reset).  
4. PHI encrypt backfill penceresi ve reçete hard-stop QA (Gün 5 backlog’undan).

---

### Öğrenilenler

- **WIP’i aynı gün merge edememek normal:** Büyük altyapı gününden sonra mobil/web polish ayrı PR’da kapanabilir; önemli olan branch’in hafta başında `main`’e alınması.  
- **Mobil API URL tek satır `localhost` olamaz:** Expo Go + fiziksel cihaz için Metro host’tan türetme veya açık `EXPO_PUBLIC_API_URL` şart.  
- **Dev-only OTP alanı:** `gelistirme_kodu` smoke’u hızlandırır; production’da dönmemesi auth service tarafında net koşula bağlanmalı.  
- **Pagination sözleşmesi istemciyi de bozar:** Backend `Page[T]` geçince lookup/listelerin hepsinin `page_size` bilmesi gerekir; unutulan ekranlar sessizce kırılır veya aşırı veri çeker.

---

*Bu rapor, 27.07.2026’da merge edilen PR [#23](https://github.com/opanda01/full-stack-hospital-system/pull/23) (`0359aba`) ve içindeki mobil OTP / LAN API / web lookup commit’leri esas alınarak hazırlanmıştır.*
