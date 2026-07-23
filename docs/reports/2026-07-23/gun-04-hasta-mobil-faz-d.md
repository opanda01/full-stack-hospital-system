# Staj Defteri — Gün 4: Hasta Mobil İstemci (Faz D)

**Tarih:** 23 Temmuz 2026  
**Proje:** Çanakkale Mehmet Akif Ersoy Devlet Hastanesi HBYS  
**Kapsam:** Expo hasta mobil uygulamasının OTP auth, oturum yaşam döngüsü, randevu ve tetkik akışlarıyla backend HASTA RBAC’ine hizalanması

---

### 1. Günün Amacı

Personel web panelleri (Faz F–K) oturmuşken, ROADMAP **Faz D** kapsamında hasta mobil istemcisi iskeletten çıkarıldı. Kritik sapma giderildi: mobil hâlâ e-posta/şifre ve deprecated `/auth/register` kullanıyordu; backend ise salt-hasta için OTP zorunlu kılıyordu.

Branch: `feature/hasta-mobil-faz-d` (`main` güncelinden).

---

### 2. Kimlik Doğrulama (OTP)

#### Backend (mevcut)

- `POST /auth/otp/gonder` / `POST /auth/otp/dogrula` (`GIRIS` | `KAYIT`)
- Salt-hasta şifre login → 403 (“OTP akışını kullanın”)
- Token claim: `oturum_tipi=hasta` → izin matrisi her zaman `HASTA`

#### Mobil

- `GirisYapForm` / `KayitOlForm`: telefon + TC (+ kayıtta ad/soyad/KVKK) → OTP → token
- E-posta/şifre formu ve `/auth/register` çağrısı kaldırıldı
- Demo: TC `10000000006`, telefon `05551234567` (seed’de telefon alanı dolduruldu); OTP kodu SMS stub / konsol

---

### 3. Oturum Yaşam Döngüsü

- `expo-secure-store` ile access + refresh + rol saklama
- Zustand `hydrate` root layout’ta; token yoksa `(auth)`, varsa `(hasta)` tabs
- `apiFetch`: 401 → `/auth/refresh` retry; başarısızsa clear
- Profil **Çıkış**: `POST /auth/logout` + SecureStore temizliği

---

### 4. Klinik Hasta Akışları

| Ekran | API | Not |
|-------|-----|-----|
| Randevularım | `GET/DELETE /randevular/` | KENDI_KAYDIM; pull-to-refresh; iptal |
| Randevu Al | `/hastalar/ben`, `/departmanlar/`, `/doktorlar/`, `/randevular/musait`, `POST /randevular/` | Doktor listesi seçilen `departman_id` ile client-side filtre |
| Tetkikler | `GET /tetkikler/` | Durum + sonuç dosyası / bekliyor |
| Profil | `GET /auth/me` | Rol, KVKK, çıkış |

---

### 5. Dokümantasyon

- `docs/ROADMAP.md` — Faz D “uygulandı”
- `docs/qa-checklist.md` — Faz D OTP / SecureStore / randevu / tetkik maddeleri

---

### 6. Sonraki Adımlar

1. Manuel smoke: OTP giriş → randevu al → iptal; tetkik uçtan uca (doktor → laborant → mobil).  
2. Faz C: gerçek SMS gateway (mobil OTP üretimde stub’dan çıkar).  
3. İsteğe bağlı: `GET /doktorlar/?departman_id=` sunucu filtresi; şikayet/öneri mobil ekranı.  
4. Expo CI / cihaz matrisi (test-plan “Sonra” maddesi).

---

### Öğrenilenler

- **İstemci–API sözleşmesi drift’i pahalıdır:** Mobil şifre login’i backend OTP’ye geçtikten sonra kırık kalmıştı; Faz D’nin ilk işi hizalama oldu.  
- **Hasta oturumu ≠ personel oturumu:** Aynı kullanıcı çift profilde olsa bile mobil yalnızca `oturum_tipi=hasta` token’ı ile çalışmalı.  
- **SecureStore + refresh:** Stateless JWT’de mobil UX için hydrate ve sessiz yenileme zorunlu; yoksa her açılışta OTP yorgunluğu oluşur.

---

*Bu rapor, 23.07.2026 tarihli `feature/hasta-mobil-faz-d` çalışması ve `docs/ROADMAP.md` Faz D maddeleri esas alınarak hazırlanmıştır.*
