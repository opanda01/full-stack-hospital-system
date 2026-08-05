# Staj Defteri — Gün 13: Hasta OTP kapsam düzeltmesi ve mobil sekme UX

**Tarih:** 5 Ağustos 2026  
**Proje:** Devlet Hastanesi HBYS  
**Kapsam:** `KENDI_KAYDIM` filtrelerinde `oturum_tipi=hasta` ile DB rolü uyumsuzluğu; mobil özet / randevu / tahlil hata gösterimi; orta sekme “Randevu Al” FAB hizası

---

### 1. Günün Amacı

Faz 3 dalında (`feature/hbys-faz-3`) hasta mobilde Figma referanslı arayüz ve push altyapısı varken, fiziksel cihazda **Özet** ekranında “Kendi kaydı kapsamı bu rol için tanımlı değil”, **Randevu** ve **Tahlil** sekmelerinde ise genel “Sunucuya bağlanılamadı” şikâyeti alındı. Günün odağı kök nedeni backend’de kapatmak, mobilde gerçek API mesajını göstermek ve alt sekme çubuğundaki FAB’ı oturtmaktı.

| Alan | Sorun | Çözüm özeti |
|------|--------|-------------|
| Özet (`GET /hastalar/ben/ozet`) | İzin matrisi hasta oturumu; liste filtresi DB `rol` | `erisim_rolu()` + `oturum_tipi` parametresi |
| Randevu / tahlil listeleri | 403 → “bağlanılamadı” | `fetchRandevular` / `parseError`; catch’te `Error.message` |
| Alt sekme | Orta “Randevu Al” kayık | Tab bar yüksekliği, FAB 56px, label sarmalayıcı |

---

### 2. Backend — Hasta OTP oturumu ve KENDI_KAYDIM

#### Kök neden

`require_permission` / `effective_rol_for_request` hasta OTP token’ında **`Rol.HASTA`** matrisini uygular (`oturum_tipi=HASTA`). Buna karşılık `randevu_service.listele_sorgu` ve `tetkikler._liste_sorgu` içindeki `kendi()` closure’ı yalnızca `current_user.rol` (veritabanı) kullanıyordu. Aynı kullanıcı hem personel (ör. DOKTOR) hem hasta profiline sahipse izin HASTA, filtre personel/doktor dalına düşüyor veya “Kendi kaydı kapsamı…” 403 üretiyordu.

#### Uygulama

- `backend/app/core/scope.py`: `erisim_rolu(current_user, oturum_tipi)` — hasta oturumunda filtre rolü her zaman `HASTA`.
- `randevular/service.py` + `router.py`: `listele_sorgu` / `listele` → `oturum_tipi` request’ten.
- `tetkikler/service.py` + `router.py`: `_liste_sorgu` / `listele` aynı desen.
- `hastalar/phr_service.py` + `router.py`: `hasta_ozet(..., oturum_tipi)` randevu özetine aktarılır.

#### Test

- `backend/tests/features/test_hasta_phr.py`: `test_hasta_oturumunda_personel_rolu_ile_ozet` (doktor token + `OturumTipi.HASTA`).
- PHR + RBAC alt kümesi: **55 passed**.

---

### 3. Mobil — Hata metni ve sekme çubuğu

- `mobile/app/(hasta)/randevularim/index.tsx`: `fetchRandevular`; API `detail` kullanıcıya yansır.
- `mobile/app/(hasta)/tetkik-sonuclarim/index.tsx`: catch bloğu gerçek mesaj.
- `mobile/app/(hasta)/_layout.tsx`: FAB boyutu, `fabLabelWrap`, iOS/Android tab bar padding.

`npm run typecheck` (mobile) temiz.

---

### 4. Operasyon notları

- Backend yeniden başlatılmalı; mobilde **çıkış → OTP ile tekrar giriş** önerilir.
- Giriş TC’sinin seed’de **hasta** kaydı olması gerekir; yoksa “Hasta kaydı bulunamadı” beklenen davranıştır.

---

### 5. İlgili dosyalar

| Katman | Dosyalar |
|--------|----------|
| Core | `backend/app/core/scope.py` |
| API | `randevular/*`, `tetkikler/*`, `hastalar/phr_service.py`, `hastalar/router.py` |
| Test | `backend/tests/features/test_hasta_phr.py` |
| Mobil | `mobile/app/(hasta)/_layout.tsx`, `randevularim/index.tsx`, `tetkik-sonuclarim/index.tsx` |

---

### 6. Sonraki adımlar (kısa)

- `muayeneler`, `epikriz` vb. `KENDI_KAYDIM` erişim kontrollerinde aynı `erisim_rolu` deseninin taranması (gerekirse).
- `docs/MOBİLE-ROADMAP.md` Faz 1 push / PIN maddelerinin cihazda smoke doğrulaması.
