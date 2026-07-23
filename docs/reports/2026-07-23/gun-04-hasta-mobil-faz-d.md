# Staj Defteri — Gün 4: Hasta Mobil İstemci (Faz D) + Expo SDK 54

**Tarih:** 23 Temmuz 2026  
**Proje:** Çanakkale Mehmet Akif Ersoy Devlet Hastanesi HBYS  
**Kapsam:** Hasta mobil Faz D (OTP auth, oturum, randevu, tetkik); fiziksel cihazda Expo Go çalıştırma; monorepo Metro sorunları; Expo SDK 52 → 54 yükseltmesi

---

### 1. Günün Amacı

Personel web panelleri (Faz F–K) tamamlandıktan sonra ROADMAP **Faz D** ile hasta mobil istemcisine geçildi. Hedef: iskelet uygulamayı backend’deki OTP + HASTA RBAC ile hizalamak ve aynı ağdaki fiziksel telefonda Expo Go ile smoke edilebilir hale getirmek.

| İş | Detay |
|----|--------|
| Branch | `feature/hasta-mobil-faz-d` (`main` güncelinden) |
| PR | [#15](https://github.com/opanda01/full-stack-hospital-system/pull/15) — OTP / randevu / tetkik (ilk commit) |
| Sonraki yerel değişiklikler | SDK 54, `@expo/metro-runtime` pin, Metro monorepo config (commit bekliyor) |

---

### 2. Faz D — Ürün / Kod

#### Kritik sapma (öncesi)

Mobil e-posta+şifre ve deprecated `/auth/register` kullanıyordu; backend salt-hasta için OTP zorunlu (şifre login → 403).

#### Kimlik doğrulama

- `GirisYapForm` / `KayitOlForm`: telefon + TC (+ kayıtta ad/soyad/KVKK) → OTP → `oturum_tipi=hasta`
- Demo: TC `10000000006`, telefon `05551234567` (seed); OTP kodu SMS stub / konsol

#### Oturum

- `expo-secure-store` + Zustand hydrate
- `apiFetch`: 401 → refresh retry; profil çıkış → `/auth/logout`

#### Klinik ekranlar

| Ekran | API |
|-------|-----|
| Randevularım | `GET/DELETE /randevular/` |
| Randevu Al | departman → doktor (filtre) → `musait` → `POST /randevular/` |
| Tetkikler | `GET /tetkikler/` |
| Profil | `GET /auth/me` |

#### Dokümantasyon (Faz D)

- `docs/ROADMAP.md` — Faz D uygulandı
- `docs/qa-checklist.md` — mobil OTP maddeleri
- `README.md` — OTP / LAN API notları

---

### 3. Fiziksel Cihaz + LAN

- PC Wi‑Fi IP: `172.20.10.3`
- `mobile/.env` → `EXPO_PUBLIC_API_URL=http://172.20.10.3:8000`
- Expo LAN modu; telefon aynı ağda Expo Go ile bağlanır
- Backend Docker `0.0.0.0:8000` health OK

---

### 4. Çalıştırma / Build Sorunları ve Çözümler

Gün içinde Expo Go “loading → bir şeyler yanlış gitti” ve ardından `runtime not ready` / `getDevServer is not a function` hataları alındı. Özet kök nedenler:

| Sorun | Kök neden | Çözüm |
|-------|-----------|--------|
| Bundle fail / Metro `empty-module` | Çözümleme `C:\Users\Lenovo\node_modules`’a kaçıyordu; pnpm monorepo | `mobile/metro.config.js`: `watchFolders`, `disableHierarchicalLookup`, proje `emptyModulePath` |
| Expo Go SDK uyumsuzluğu | Proje SDK 52; telefon Expo Go SDK 54 | Expo **~54**, RN **0.81.5**, React **19.1**, `expo-router` **~6** |
| `getDevServer is not a function` | `@expo/metro-runtime` **4.0.1** kalmıştı | Doğrudan bağımlılık + override **~6.1.2**; `unstable_enablePackageExports: false` |
| Port karmaşası | Eski Metro 8081’i tutuyordu; istemci 8082’ye düşüyordu | Portu boşaltıp `--port 8081` ile tek sunucu |

Ek paketler (SDK 54 peer’leri): `expo-linking`, `expo-constants`, `react-native-gesture-handler`, `babel-preset-expo`.  
`.npmrc`: `node-linker=hoisted` + expo/metro hoist kalıpları.

Doğrulama: Android bundle Metro’da **200** (~7.6 MB, 1140 modül); `@expo/metro-runtime` **6.1.2**.

---

### 5. Gün Sonu Durumu

- Faz D işlevsel kodu PR #15’te; SDK 54 / Metro düzeltmeleri branch’te yerel (henüz PR’a ek commit atılmamış olabilir).
- Çalıştırma:

```bash
pnpm --filter mobile exec expo start --lan --clear --port 8081
# Telefon: exp://172.20.10.3:8081
```

---

### 6. Sonraki Adımlar

1. SDK 54 + Metro fix commit’ini PR #15’e ekle / merge.  
2. Manuel smoke: OTP → randevu al/iptal → tetkik (doktor → laborant → mobil).  
3. Faz C: gerçek SMS gateway.  
4. Expo CI / cihaz matrisi.

---

### Öğrenilenler

- **İstemci–API drift:** Şifre UI, OTP backend ile uyumsuz kalınca mobil tamamen kırılır; Faz D önce hizalama olmalı.  
- **Expo Go = sabit SDK:** Store’daki Go sürümü projeyi zorlar; monorepo’da yükseltme + peer pin şart.  
- **`@expo/metro-runtime` sürümü kritik:** Eski 4.x ile SDK 54 `getDevServer` / “runtime not ready” üretir; override + doğrudan bağımlılık gerekir.  
- **Windows + pnpm:** Üst dizin `node_modules` ve dosya kilitleri (EPERM) kurulum/Metro’yu bozar; hoist + net Metro kökü şart.

---

*Bu rapor, 23.07.2026 tarihli `feature/hasta-mobil-faz-d` çalışması (PR #15 + SDK 54 / Metro düzeltmeleri) esas alınarak hazırlanmıştır.*
