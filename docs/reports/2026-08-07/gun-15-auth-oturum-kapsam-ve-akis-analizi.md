# Staj Defteri — Gün 15: Auth akış analizi, oturum kapsamı ve PR #36

**Tarih:** 7 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Kapsam:** Çift profil (personel + hasta) OTP oturumunda veri kapsamı; JWT / `/auth/me` rol tutarlılığı; OTP telefon normalizasyonu; web hasta OTP girişi ve auth store; mobil hasta guard ve yönlendirme; izin matrisi temizliği

---

### 1. Günün Amacı

Gün 13’te (#34) ve Gün 14’te (#35 mobil önbellek/skeleton) tamamlanan işlerin ardından, kod taramasında kalan auth/kapsam boşlukları hedeflendi. Gün 13’te randevu, tetkik ve hasta özetinde `erisim_rolu` + `oturum_tipi` deseni kapatılmıştı (#34). Fiziksel cihaz ve kod taramasında **aynı desenin eksik kaldığı** modüller (muayene, epikriz, radyoloji, alerji, klinik onay, randevu erişim kontrolü) ile **istemci tarafı** oturum senkronu, demo formlar ve yönlendirme tutarsızlıkları tespit edildi. Günün odağı: uçtan uca akış analizi, backend’de tek kaynak kapsam kuralı, OTP güvenliği ve web/mobil hasta giriş deneyimini hizalamak.

| Alan | Sorun | Çözüm özeti |
|------|--------|-------------|
| Backend servisler | `require_permission` HASTA; filtre `current_user.rol` | `erisim_rolu(..., oturum_tipi)` router’dan servise |
| JWT / me | Hasta oturumunda claim DB rolü | Access token + `/auth/me` efektif `HASTA` |
| OTP | `555…` vs `0555…`; boş telefonda zayıf bağ | `telefon_normalize`; GIRIS’te kayıt/eşleşme |
| Web | Refresh/rehydrate KVKK; `/ayarlar` hasta → `/giris` | `fetchMe` + interceptor; `/hasta` linkleri |
| Mobil | Auth stack → randevularim; yalnızca token guard | `ozet` hedefi; `rol === HASTA` + `hydrated` |

---

### 2. Backend — Oturum tipine göre kapsam

#### Kök neden

Hasta OTP ile girişte `oturum_tipi=HASTA` ve izin matrisi `Rol.HASTA` uygulanır; veritabanında kullanıcı hâlâ örneğin `DOKTOR` veya `HEMSIRE` olabilir. `KENDI_KAYDIM` ve kayıt erişim kontrollerinde yalnızca `current_user.rol` kullanıldığında hasta kendi PHR verisine erişemez veya yanlış personel kapsamına düşer.

#### Uygulama

- **Muayeneler, randevular** (`randevu_erisim_kontrolu`, `olustur`), **hastalar** (`get_hasta_scoped`, `list_benim_hastalar`), **radyoloji**, **tetkikler** (erişim + hasta görüldü), **epikriz**, **alerji**, **klinik onay** listesi/erişim: `erisim_rolu` ve `request.state.oturum_tipi`.
- **Auth:** `_issue_tokens` — hasta oturumunda JWT `rol` claim `HASTA`; `GET /auth/me` yanıtında efektif rol oturum tipine göre.
- **Telefon:** `backend/app/core/telefon.py`; `otp_gonder` / `otp_dogrula` normalizasyonu; GIRIS’te kayıtlı telefon normalize eşleşmesi; ilk başarılı GIRIS’te telefon kaydı.
- **Rate limit:** `sifre-sifirla/istek` ve `onay` IP middleware listesine eklendi.
- **İzinler:** `_mudur_izinleri` yinelenen anahtarlar temizlendi; başhekime `denetim:detay` açık kayıt.

#### Test

- `backend/tests/features/test_auth_extended.py`: çift profil OTP, `rol === HASTA` token yanıtı, `test_telefon_normalize` — **12 passed** (lokal).

---

### 3. Web — Hasta OTP ve oturum store

- Yeni rota **`/hasta`**: `HastaGirisForm` (OTP); personel **`/giris`** ayrımı korunur.
- `loginWithOtp`: yalnızca `oturum_tipi === "hasta"`.
- `authStore`: refresh sonrası onboarding alanları + `fetchMe`; rehydrate’te KVKK varsayılanı `false` ve token varsa arka planda `fetchMe`.
- `AyarlarRedirect` ve `HastaMobilPage`: hasta için `/hasta` / `/hasta-mobil`; demo TC/telefon yalnızca `import.meta.env.DEV`.
- `tc-kimlik.ts`: 10. hane mod düzeltmesi (`((x % 10) + 10) % 10`).
- Mock kullanıcı e-postaları `@hastane.example.com` (seed ile uyum).

---

### 4. Mobil — Guard ve giriş hedefi

- `(auth)/_layout`: mevcut token ile yönlendirme **`/(hasta)/ozet`** (login ile aynı).
- `(hasta)/_layout`: `hydrated` + `token` + **`rol === "HASTA"`**.
- Giriş / kayıt OTP: `oturum_tipi !== "hasta"` reddi; demo alanları `__DEV__`; TC mod düzeltmesi.

---

### 5. Pull request

- Dal: `feature/auth-oturum-kapsam` → `main`
- Commit: `fix(auth): hasta oturum kapsami, OTP telefon ve istemci senkronu`
- PR: [#36](https://github.com/opanda01/full-stack-hospital-system/pull/36)

*(Aynı çalışma gününde mobil sekme skeleton / React Query önbelleği `feature/mobile-tab-loading-skeletons` dalında ayrı tutuldu; auth düzeltmeleri bilinçli olarak `main` tabanlı ayrı PR’da toplandı.)*

---

### 6. Operasyon notları

- Backend yeniden başlatılmalı (telefon normalize + servis imzaları).
- Demo hasta: TC `34917047162`, tel `05551234567` (`seed_rbac` / `demo-credentials.ts`).
- Web hasta OTP için `VITE_USE_MOCK_AUTH=false` ve canlı `/auth/otp/*` gerekir.
- Çift profilli kullanıcıda personel şifre girişi ile hasta OTP farklı `oturum_tipi`; testte her iki token ile ayrı smoke önerilir.

---

### 7. İlgili dosyalar (özet)

| Katman | Dosyalar |
|--------|----------|
| Core | `scope.py`, `telefon.py`, `login_rate_limit.py`, `permissions.py` |
| Auth | `features/auth/service.py`, `router.py` |
| Klinik API | `muayeneler`, `randevular`, `hastalar`, `radyoloji`, `tetkikler`, `epikriz`, `klinik_onay` service/router |
| Test | `tests/features/test_auth_extended.py` |
| Web | `features/hasta-giris/*`, `shared/auth/*`, `app/router.tsx`, `tc-kimlik.ts` |
| Mobil | `app/(auth)/_layout.tsx`, `app/(hasta)/_layout.tsx`, `giris-yap`, `kayit-ol`, `tcKimlik.ts` |

---

### 8. Sonraki adımlar (kısa)

- PR #36 CI ve code review; merge sonrası staging’de checklist (plan’daki manuel OTP / refresh / `/ayarlar` maddeleri).
- `kullanici_roller` DB senkronu veya admin dokümantasyonu (düşük öncelik, D3).
- Mobil skeleton dalının (`feature/mobile-tab-loading-skeletons`) ayrı PR ile `main`’e alınması.

---

*Bu rapor, 7.08.2026 tarihli akış analizi düzeltme planı, `feature/auth-oturum-kapsam` commit’i ve PR #36 esas alınarak hazırlanmıştır.*
